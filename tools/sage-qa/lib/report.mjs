const escapeHtml = (value) => `${value ?? ''}`
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const number = (value) => Number(value ?? 0).toLocaleString('en-US');

const passBadge = (pass) => `<span class="badge ${pass ? 'pass' : 'fail'}">${pass ? 'PASS' : 'FAIL'}</span>`;

export const renderHtmlReport = (run) => {
  const zoneReports = run.zoneValidation?.raw?.reports ?? [];
  const raceFailures = run.raceAudit?.summary?.failures ?? [];
  const animationDiagnostics = run.raceAudit?.summary?.animationDiagnostics ?? [];
  const memoryRows = (run.memorySnapshots ?? []).map((snapshot) => `
    <tr>
      <td>${escapeHtml(snapshot.stage)}</td>
      <td>${escapeHtml(snapshot.timestamp)}</td>
      <td>${(snapshot.system.usedPercent ?? 0).toFixed(1)}%</td>
      <td>${(snapshot.system.freeBytes / 1048576).toFixed(0)} MB</td>
      <td>${(snapshot.runner.rssBytes / 1048576).toFixed(0)} MB</td>
    </tr>`).join('');
  const zoneRows = zoneReports.map((report) => `
    <tr>
      <td>${passBadge(report.pass?.all)}</td>
      <td>${escapeHtml(report.zone)}</td>
      <td>${report.validationSequence?.cycle ?? 1}</td>
      <td>${number(report.spawns?.loaded)}/${number(report.spawns?.requested)}</td>
      <td>${number(report.visuals?.readyTextureCount)}/${number(report.visuals?.materialSlotCount)}</td>
      <td>${number(report.visuals?.animatedSkeletonSpawnCount)}/${number(report.visuals?.skeletonSpawnCount)}</td>
      <td>${number(report.visuals?.runtimeAnimation?.movingSpawnCount)}/${number(report.visuals?.runtimeAnimation?.probedSpawnCount)}</td>
      <td>${number(report.visuals?.playingAnimationGroupCount)}/${number(report.visuals?.animationGroupCount)}</td>
      <td>${number(report.visuals?.excessAnimationGroupCount)}</td>
      <td>${number(report.visuals?.appearanceTextureDecodeFailureCount)}</td>
      <td>${number(report.visuals?.nameplateCount)}/${number(report.visuals?.nameplateExpectedCount)}</td>
      <td>${number(report.doors?.loaded)}/${number(report.doors?.visibleRequested)}</td>
      <td>${number(report.sceneResources?.animationGroups)}</td>
      <td>${report.runtimeMemory?.jsHeapUsedBytes ? `${(report.runtimeMemory.jsHeapUsedBytes / 1048576).toFixed(0)} MB` : 'n/a'}</td>
    </tr>`).join('');
  const samples = (run.visualSamples ?? []).map((sample) => {
    const violations = [
      ...(sample.observationAnalyses ?? []).flatMap((analysis) => analysis.violations ?? []),
      ...(sample.approvedBaselineAnalyses ?? []).flatMap((analysis) => analysis.violations ?? []),
      ...(sample.repeatability?.violations ?? []),
    ];
    return `
    <figure>
      <img src="${escapeHtml(sample.relativeScreenshot)}" alt="${escapeHtml(sample.model)} preview">
      <figcaption>${escapeHtml(sample.model.toUpperCase())} face ${sample.face ?? 0}, texture ${sample.texture ?? 0}, helm ${sample.helmTexture ?? 0}${Object.hasOwn(sample, 'heading') ? `, heading ${sample.heading}` : ''} · ${number(sample.repetitions ?? 1)} independent render(s) · motion ${sample.observations?.[0]?.animationMotion?.expectedMotion === false ? 'native static pose' : sample.observations?.[0]?.animationMotion?.moving === true ? 'verified' : 'missing'} · approved baseline ${(sample.approvedBaselineAnalyses ?? []).some((analysis) => analysis.skipped === false) ? 'checked' : 'not available'} ${passBadge(sample.pass)}${violations.length ? `<br><code>${escapeHtml([...new Set(violations)].join(', '))}</code>` : ''}</figcaption>
    </figure>`;
  }).join('');
  const failureItems = [
    ...(run.failures ?? []),
    ...raceFailures.map((failure) => `Race ${failure.model}: ${failure.status}`),
    ...(run.soak?.violations ?? []),
  ].map((failure) => `<li>${escapeHtml(typeof failure === 'string' ? failure : JSON.stringify(failure))}</li>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sage QA ${escapeHtml(run.runId)}</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, Segoe UI, sans-serif; background: #0a0f16; color: #e7edf5; }
    body { margin: 0 auto; max-width: 1500px; padding: 24px; }
    h1, h2 { color: #f2dfad; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 12px; }
    .card { background: #111a25; border: 1px solid #2b3a4d; border-radius: 8px; padding: 14px; }
    .card strong { display: block; font-size: 1.35rem; margin-top: 6px; }
    table { border-collapse: collapse; width: 100%; background: #0f1722; }
    th, td { border: 1px solid #29384a; padding: 8px; text-align: left; }
    th { background: #172233; color: #f2dfad; }
    .badge { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 0.75rem; font-weight: 700; }
    .pass { background: #123d2b; color: #8ef0b7; }
    .fail { background: #4a1d24; color: #ff9fa9; }
    .samples { display: grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap: 16px; }
    figure { margin: 0; background: #111a25; border: 1px solid #2b3a4d; padding: 10px; }
    img { width: 100%; height: auto; display: block; background: #000; }
    figcaption { padding-top: 8px; }
    code { color: #b9d6ff; }
  </style>
</head>
<body>
  <h1>Sage QA ${passBadge(run.pass)}</h1>
  <p><code>${escapeHtml(run.runId)}</code> · ${escapeHtml(run.profile?.name)} · ${escapeHtml(run.startedAt)} to ${escapeHtml(run.completedAt)}</p>
  <div class="summary">
    <div class="card">Zones<strong>${number(run.zoneValidation?.summary?.reportCount)}</strong></div>
    <div class="card">NPCs<strong>${number(run.zoneValidation?.summary?.npcCount)}</strong></div>
    <div class="card">Zone models<strong>${number(run.zoneValidation?.summary?.uniqueModelCount)}</strong></div>
    <div class="card">Audited models<strong>${number(run.raceAudit?.summary?.auditedModelCount)}</strong></div>
    <div class="card">Appearance checks<strong>${number(run.raceAudit?.summary?.appearanceVariantCountAudited)}</strong></div>
    <div class="card">Animation diagnostics<strong>${number(run.raceAudit?.summary?.animationDiagnosticCount)}</strong></div>
    <div class="card">Texture slots<strong>${number(run.zoneValidation?.summary?.npcTextureReadyCount)}</strong></div>
    <div class="card">Texture decode failures<strong>${number(run.zoneValidation?.summary?.appearanceTextureDecodeFailureCount)}</strong></div>
    <div class="card">Playing animation groups<strong>${number(run.zoneValidation?.summary?.playingAnimationGroupCount)}/${number(run.zoneValidation?.summary?.animationGroupCount)}</strong></div>
    <div class="card">Excess animation groups<strong>${number(run.zoneValidation?.summary?.excessAnimationGroupCount)}</strong></div>
    <div class="card">Independent visual renders<strong>${number((run.visualSamples ?? []).reduce((total, sample) => total + Number(sample.repetitions ?? 0), 0))}</strong></div>
  </div>
  <h2>Zone matrix</h2>
  <table><thead><tr><th>Status</th><th>Zone</th><th>Cycle</th><th>NPCs</th><th>Textures</th><th>Skeletons</th><th>Moving probes</th><th>Playing animation groups</th><th>Excess animation groups</th><th>Texture decode failures</th><th>Nameplates</th><th>Doors</th><th>Scene animation groups</th><th>JS heap</th></tr></thead><tbody>${zoneRows}</tbody></table>
  <h2>Memory stewardship</h2>
  <table><thead><tr><th>Stage</th><th>Time</th><th>System used</th><th>System free</th><th>Runner RSS</th></tr></thead><tbody>${memoryRows}</tbody></table>
  ${samples ? `<h2>Visual samples</h2><div class="samples">${samples}</div>` : ''}
  <h2>Static animation diagnostics</h2>
  ${animationDiagnostics.length
    ? `<p>${number(animationDiagnostics.length)} static model container(s) expose animation groups with no measurable pose delta. These are retained as coverage diagnostics; runtime T-pose correctness is enforced by the zone matrix.</p><p><code>${escapeHtml(animationDiagnostics.map((item) => item.model).join(', '))}</code></p>`
    : '<p>None.</p>'}
  <h2>Failures</h2>
  ${failureItems ? `<ul>${failureItems}</ul>` : '<p>None.</p>'}
</body>
</html>`;
};
