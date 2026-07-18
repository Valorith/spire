const count = (value) => Array.isArray(value) ? value.length : 0;

export const compactRunSummary = (run) => ({
  ...run,
  staticTextureAudit: run.staticTextureAudit ? {
    pass: run.staticTextureAudit.pass,
    mappedAvailableModelCount: run.staticTextureAudit.mappedAvailableModelCount ?? 0,
    affectedAvailableModelCount: run.staticTextureAudit.affectedAvailableModelCount ?? 0,
    affectedMissingModelCount: run.staticTextureAudit.affectedMissingModelCount ?? 0,
    artifact: 'static-texture-audit.json',
  } : null,
  zoneValidation: run.zoneValidation ? {
    pass: run.zoneValidation.pass,
    summary: run.zoneValidation.summary,
    url: run.zoneValidation.url,
    artifact: 'zone-validation.json',
  } : null,
  raceAudit: run.raceAudit ? {
    summary: run.raceAudit.summary,
    artifact: 'race-audit-batches.json',
  } : null,
  diagnostics: run.diagnostics ? {
    ...(run.diagnosticSummary ?? {
      consoleErrorCount: count(run.diagnostics.consoleErrors),
      recoveredConsoleErrorCount: 0,
      pageErrorCount: count(run.diagnostics.pageErrors),
      requestFailureCount: count(run.diagnostics.requestFailures),
      recoveredRequestFailureCount: 0,
      httpErrorCount: count(run.diagnostics.httpErrors),
    }),
    artifact: 'telemetry.json',
  } : null,
});
