# Server restart schedules

Open **Server Admin → Restart Schedules**. Add a daily, weekday, weekly, or one-time restart, choose a time zone and player warning, then save. The editor previews the next three occurrences. Pause a schedule with its switch, or cancel an active countdown without changing future recurring restarts.

Spire's **HTTP server must remain running**. Run Spire as a service for unattended use. Schedules control the local server installation beside `eqemu_config.json`; selecting a remote database connection does not change their target. Distributed installations schedule restarts on the root node.

## Timing and recovery

- Recurring schedules follow local calendar time in the selected IANA time zone. Time zone data is bundled, including on Windows.
- A time skipped by the spring daylight saving change is skipped for that day. A repeated autumn time runs once, at its first occurrence.
- If installed time-zone rules change, pending occurrences are recalculated and logged before scheduling continues. Schedule management remains available.
- Warnings start before the restart time and repeat each minute through world chat and marquee. Delivery failures are logged; an unavailable world connection does not prevent recovery of the server.
- A stopped launcher stays stopped. Restarts target processes belonging to this server installation. Overlapping manual actions and scheduled restarts are skipped, with the reason recorded in history.
- Launcher copies use installation-specific temporary directories. If an older shared temporary launcher has an unreadable working directory, the restart fails with its PID so that process can be stopped before retrying.
- Future countdowns resume after Spire restarts. Missed restarts are skipped instead of being replayed when Spire returns, including after host sleep or a suspended process. A running scheduler allows a 30-second timing tolerance.
- Once shutdown has begun, cancellation is unavailable. Spire uses the world telnet address and port in `eqemu_config.json` for announcements and waits up to two minutes for the new world to answer before reporting success or a health-check failure.
- If Spire stops after claiming a restart, that attempt is marked **Interrupted** and is not repeated. Check server status before taking further action.
- One-time schedules turn off after their occurrence is consumed, including a cancellation or skipped run.

## Storage and access

Schedules, active countdowns, and the last 100 results are stored in `spire-restart-schedules.json` beside the server configuration. Include this file in server backups. Writes use a synced temporary file and atomic replacement. OS file locks protect concurrent updates, elect one scheduler, and serialize server power actions. A separate execution gate prevents executable startup and shared-memory reloads from overlapping release extraction. Network bootstrap steps run outside that gate so a failed leaf registration does not block shutdown. The gate lets a scheduled child start while its parent holds the power lock for world-health verification. Do not delete the adjacent `.lock`, `.runner.lock`, `.power.lock`, or `.startup.lock` files while Spire is running; OS locks are released automatically on process exit.

The scheduler checks a maximum of 32 schedules once per second, writes only on state changes, and does not query the database. Browser polling slows when the page is hidden, and editing uses revision checks to prevent stale saves.

The existing **Server Process Management** permission controls access. Read-only operators can inspect schedules and history; write permission is required to change schedules or cancel countdowns.

## Verification

```sh
go test ./internal/restartscheduler ./internal/eqemuserver ./internal/eqemuserverconfig ./internal/permissions ./internal/websocket
npx playwright test tests/restart-schedules.spec.ts
```

The browser tests use isolated API fixtures. Backend tests exercise real storage, locking, recovery, timing, and API handlers without restarting a live game server. The launcher CI workflow also runs these backend tests on Linux and Windows, with Linux race checks.

For a browser pass using the real API and scheduler with simulated process actions, start `tests/fixtures/restart-server` on loopback port 3021 and a frontend on port 8081 with `VUE_APP_BACKEND_BASE_URL=http://127.0.0.1:3021`. Set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8081` and `SPIRE_RESTART_QA_API=http://127.0.0.1:3021`, then run `npx playwright test tests/restart-schedules-live.spec.ts`. The fixture creates its own temporary server directory and never controls game processes.

Finish manual countdown checks before running the live browser suite. The shared fixture permits one power action at a time.

`TestActualStopRespectsInstallationInSandbox` exercises real launcher signals against two dummy installations and verifies that stopping one leaves the other running. It requires Docker with `SPIRE_ISOLATED_LAUNCHER_QA=1`; ordinary backend test runs skip it.
