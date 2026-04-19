param(
  [int]$Port = 8104
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $repoRoot 'scripts\serve-sage-preview.js'

Start-Process -FilePath node `
  -ArgumentList @($scriptPath, $Port) `
  -WorkingDirectory $repoRoot

Write-Host "Started Sage preview server. Open http://127.0.0.1:$Port/sage"
