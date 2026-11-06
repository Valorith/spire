import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { startLoggedProcess } from './start.mjs';

const self = fileURLToPath(import.meta.url);
const fixtureArgs = ['hello world', 'quote"test', 'C:\\trailing\\', ''];
const windows = process.platform === 'win32';
const execFileAsync = promisify(execFile);

async function alive(pid) {
  try { process.kill(pid, 0); }
  catch (error) { if (error.code === 'ESRCH') return false; throw error; }
  if (process.platform === 'linux') {
    try {
      // A stopped orphan can await reaping by the container's init process.
      return !/\) Z /.test(await fs.readFile(`/proc/${pid}/stat`, 'utf8'));
    } catch (error) { if (error.code === 'ENOENT' || error.code === 'ESRCH') return false; throw error; }
  }
  return true;
}

if (process.argv[2] === '--launch') {
  const dir = process.argv[3];
  const child = await startLoggedProcess({
    command: process.execPath,
    args: [path.join(dir, 'worker.cjs'), 'root', dir, ...fixtureArgs],
    cwd: dir,
    stdoutPath: path.join(dir, 'stdout.log'),
    stderrPath: path.join(dir, 'stderr.log'),
    env: { ...process.env, LOCAL_SPIRE_CONSOLE_PROOF: 'preserved' },
  });
  await fs.writeFile(path.join(dir, 'root.pid'), String(child.pid));
} else {
  const dir = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), 'spire-dev-process-test-'));
  let rootPid;
  let childPid;
  try {
    await fs.writeFile(path.join(dir, 'worker.cjs'), String.raw`
const fs = require('node:fs');
const path = require('node:path');
const { fork, spawnSync } = require('node:child_process');
const [role, dir, ...args] = process.argv.slice(2);
if (role === 'root') {
  const child = fork(__filename, ['child', dir], { stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
  child.on('message', message => fs.writeFileSync(path.join(dir, 'ready.json'), JSON.stringify({child: child.pid, args, ...message})));
} else {
  console.log('child stdout');
  console.error('child stderr');
  const shell = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/c', 'echo shell-grandchild'], {encoding: 'utf8'})
    : spawnSync('/bin/sh', ['-c', 'echo shell-grandchild'], {encoding: 'utf8'});
  if (shell.status !== 0 || !shell.stdout.includes('shell-grandchild')) throw new Error('Shell grandchild failed');
  process.send({marker: process.env.LOCAL_SPIRE_CONSOLE_PROOF, cwd: process.cwd()});
}
setInterval(() => {}, 1000);
`);
    const launch = spawnSync(process.execPath, [self, '--launch', dir], { windowsHide: true, timeout: 180000, encoding: 'utf8' });
    assert.equal(launch.status, 0, launch.stderr);
    rootPid = Number(await fs.readFile(path.join(dir, 'root.pid'), 'utf8'));
    let ready;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { ready = JSON.parse(await fs.readFile(path.join(dir, 'ready.json'), 'utf8')); break; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      await delay(100);
    }
    assert(ready, 'Grandchild never became ready after the launcher exited');
    childPid = ready.child;
    process.kill(rootPid, 0);
    process.kill(childPid, 0);
    assert.deepEqual(ready.args, fixtureArgs);
    assert.equal(ready.marker, 'preserved');
    assert.equal(ready.cwd, dir);
    assert.match(await fs.readFile(path.join(dir, 'stdout.log'), 'utf8'), /child stdout/);
    assert.match(await fs.readFile(path.join(dir, 'stderr.log'), 'utf8'), /child stderr/);

    if (windows) {
      await fs.writeFile(path.join(dir, 'console.ps1'), String.raw`
param([int]$RootProcess, [int]$ChildProcess)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ConsoleProbe {
 [DllImport("kernel32.dll")] public static extern bool FreeConsole();
 [DllImport("kernel32.dll")] public static extern bool AttachConsole(uint processId);
 [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
}
'@
foreach ($client in @($RootProcess, $ChildProcess)) {
 [void][ConsoleProbe]::FreeConsole()
 $attached = [ConsoleProbe]::AttachConsole($client)
 $window = [ConsoleProbe]::GetConsoleWindow()
 [void][ConsoleProbe]::FreeConsole()
 if (-not $attached -or $window -ne [IntPtr]::Zero) { throw "Process $client does not have a windowless console" }
}
Write-Output 'Windowless console confirmed for parent and child.'
`);
      const powershell = path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
      const consoleCheck = spawnSync(powershell, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(dir, 'console.ps1'), '-RootProcess', String(rootPid), '-ChildProcess', String(childPid)], { windowsHide: true, encoding: 'utf8', timeout: 10000 });
      assert.equal(consoleCheck.status, 0, consoleCheck.stderr);
      assert.match(consoleCheck.stdout, /Windowless console confirmed/);

      const helper = (await fs.readdir(dir)).find(name => /^start-hidden-.*\.exe$/.test(name));
      const marker = path.join(dir, 'unexpected-start');
      const failure = spawnSync(path.join(dir, helper), [path.join(dir, 'missing-pid-directory/pid'), process.execPath, '-e', 'require("node:fs").writeFileSync(process.argv[1], "started")', marker], { windowsHide: true, encoding: 'utf8' });
      assert.notEqual(failure.status, 0);
      assert.match(failure.stderr, /missing-pid-directory/);
      assert.equal(await fs.stat(marker).catch(() => null), null, 'Invalid PID destination started a worker');
    }

    await assert.rejects(startLoggedProcess({ command: path.join(dir, 'missing.exe'), args: [], cwd: dir, stdoutPath: path.join(dir, 'missing.out.log'), stderrPath: path.join(dir, 'missing.err.log') }), /Failed to start|ENOENT/);
    await assert.rejects(startLoggedProcess({ command: process.execPath, args: [], cwd: dir, stdoutPath: path.join(dir, 'bad-log.out'), stderrPath: dir }), /EISDIR|EPERM|EACCES|regular files/);
    assert.equal((await fs.readdir(dir)).filter(name => /^start-.*\.pid$/.test(name)).length, 0);

    // Independent CLI processes also share a cold helper cache safely.
    await fs.writeFile(path.join(dir, 'record.cjs'), String.raw`
const fs = require('node:fs');
const [name, ...args] = process.argv.slice(2);
console.log(name);
fs.writeFileSync(name + '.json', JSON.stringify({args, cwd: process.cwd()}));
`);
    const logs = path.join(dir, 'cli-logs');
    const cli = fileURLToPath(new URL('./cli.mjs', import.meta.url));
    const results = await Promise.all(['one', 'two'].map(async name => {
      const result = await execFileAsync(process.execPath, [cli, '--cwd', dir, '--logs', logs, '--', process.execPath, path.join(dir, 'record.cjs'), name, ...fixtureArgs], { windowsHide: true, timeout: 180000 });
      const launched = JSON.parse(result.stdout);
      assert.equal(launched.stdoutPath, path.join(logs, 'stdout.log'));
      for (let attempt = 0; attempt < 100 && await alive(launched.pid); attempt++) await delay(100);
      assert.equal(await alive(launched.pid), false, 'CLI worker did not finish');
      const recorded = JSON.parse(await fs.readFile(path.join(dir, name + '.json'), 'utf8'));
      assert.deepEqual(recorded.args, fixtureArgs);
      assert.equal(recorded.cwd, dir);
      return name;
    }));
    for (const name of results) assert.match(await fs.readFile(path.join(logs, 'stdout.log'), 'utf8'), new RegExp(name));
    assert.equal((await fs.readdir(logs)).filter(name => name.endsWith('.pid') || /\.exe\..*\.exe$/.test(name)).length, 0);
    console.log('PASS: launcher exit, parent/child survival, arguments, cwd, environment, IPC, shell grandchild, logs, and failed-start cleanup.');
    console.log('PASS: independent CLI launches sharing a cold cache, argument preservation, and log capture.');
    if (windows) console.log('PASS: both generations have windowless consoles; invalid PID handoff cannot start a worker.');
  } finally {
    if (rootPid) {
      if (windows) spawnSync('taskkill', ['/PID', String(rootPid), '/T', '/F'], { windowsHide: true });
      else { try { process.kill(-rootPid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; } }
      for (const pid of [rootPid, childPid].filter(Boolean)) {
        for (let attempt = 0; attempt < 50 && await alive(pid); attempt++) await delay(100);
        assert.equal(await alive(pid), false, `Process ${pid} survived tree shutdown`);
      }
      console.log('PASS: complete process-tree shutdown.');
    }
    const resolved = await fs.realpath(dir);
    assert.equal(path.dirname(resolved), await fs.realpath(os.tmpdir()));
    assert(path.basename(resolved).startsWith('spire-dev-process-test-'));
    await fs.rm(resolved, { recursive: true, force: true });
  }
}
