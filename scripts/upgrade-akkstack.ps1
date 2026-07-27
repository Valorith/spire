[CmdletBinding()]
param(
    [string]$AkkStackDirectory = (Get-Location).Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ReleaseUrl = "https://github.com/Valorith/spire/releases/latest/download/spire-linux-amd64.zip"
$ReleaseBinary = "spire-linux-amd64"
$ComposeMode = ""

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host "==> $Message"
}

function Invoke-Compose {
    param(
        [string]$Mode,
        [string[]]$ComposeArguments,
        [switch]$IgnoreErrors
    )

    if ($Mode -eq "plugin") {
        & docker compose @ComposeArguments
    }
    else {
        & docker-compose @ComposeArguments
    }

    if (-not $IgnoreErrors -and $LASTEXITCODE -ne 0) {
        throw "Docker Compose command failed: $($ComposeArguments -join ' ')"
    }
}

function Test-SpireService {
    param([string]$Mode)

    if ($Mode -eq "plugin") {
        & docker compose exec -T eqemu-server sh -c 'curl --silent --show-error --max-time 2 --output /dev/null "http://127.0.0.1:${SPIRE_PORT:-3000}/api/v1/app/env"' *> $null
    }
    else {
        & docker-compose exec -T eqemu-server sh -c 'curl --silent --show-error --max-time 2 --output /dev/null "http://127.0.0.1:${SPIRE_PORT:-3000}/api/v1/app/env"' *> $null
    }

    return $LASTEXITCODE -eq 0
}

$ResolvedAkkStackDirectory = $null
try {
    $ResolvedAkkStackDirectory = (Resolve-Path -LiteralPath $AkkStackDirectory).Path
}
catch {
    throw "AkkStack directory not found: $AkkStackDirectory"
}

if (-not (Test-Path -LiteralPath (Join-Path $ResolvedAkkStackDirectory "docker-compose.yml") -PathType Leaf)) {
    throw "Run this command from your AkkStack directory."
}

$BinDirectory = Join-Path (Join-Path $ResolvedAkkStackDirectory "server") "bin"
$SpirePath = Join-Path $BinDirectory "spire"
if (-not (Test-Path -LiteralPath $SpirePath -PathType Leaf)) {
    throw "Spire was not found at server\bin\spire. Finish installing AkkStack first."
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
    & docker compose version *> $null
    if ($LASTEXITCODE -eq 0) {
        $ComposeMode = "plugin"
    }
}

if (-not $ComposeMode -and (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    $ComposeMode = "standalone"
}

if (-not $ComposeMode) {
    throw "Docker Compose was not found."
}

$UpgradeStamp = (Get-Date -Format "yyyyMMdd-HHmmss") + "-" + [guid]::NewGuid().ToString("N").Substring(0, 8)
$BackupPath = "$SpirePath.before-valorith-$UpgradeStamp"
$DownloadZip = Join-Path $BinDirectory ".spire-upgrade-$UpgradeStamp.zip"
$StagingDirectory = Join-Path $BinDirectory ".spire-upgrade-$UpgradeStamp"
$StagedSpirePath = Join-Path $BinDirectory ".spire-upgrade-$UpgradeStamp.new"
$ContainerDownloadZip = "/home/eqemu/server/bin/.spire-upgrade-$UpgradeStamp.zip"
$ContainerStagingDirectory = "/home/eqemu/server/bin/.spire-upgrade-$UpgradeStamp"
$ContainerStagedSpire = "/home/eqemu/server/bin/.spire-upgrade-$UpgradeStamp.new"
$ReplacementInstalled = $false
$ServerStopped = $false

try {
    Write-Step "Downloading the latest Valorith Spire release"
    $DownloadError = $null
    for ($DownloadAttempt = 1; $DownloadAttempt -le 4; $DownloadAttempt++) {
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $ReleaseUrl -OutFile $DownloadZip
            $DownloadError = $null
            break
        }
        catch {
            $DownloadError = $_
            if ($DownloadAttempt -lt 4) {
                Start-Sleep -Seconds 2
            }
        }
    }

    if ($null -ne $DownloadError) {
        throw "The Valorith Spire release could not be downloaded after four attempts. $($DownloadError.Exception.Message)"
    }

    Write-Step "Preparing the release inside a temporary AkkStack container"
    $StageCommand = @"
set -eu
rm -rf '$ContainerStagingDirectory'
mkdir -p '$ContainerStagingDirectory'
unzip -q '$ContainerDownloadZip' -d '$ContainerStagingDirectory'
test -s '$ContainerStagingDirectory/$ReleaseBinary'
chmod 0755 '$ContainerStagingDirectory/$ReleaseBinary'
mv '$ContainerStagingDirectory/$ReleaseBinary' '$ContainerStagedSpire'
"@
    Invoke-Compose -Mode $ComposeMode -ComposeArguments @(
        "run",
        "-T",
        "--rm",
        "--no-deps",
        "--entrypoint",
        "sh",
        "eqemu-server",
        "-c",
        $StageCommand
    )

    if (-not (Test-Path -LiteralPath $StagedSpirePath -PathType Leaf)) {
        throw "The release did not produce a usable Spire binary."
    }

    Write-Step "Stopping AkkStack briefly"
    $ServerStopped = $true
    Invoke-Compose -Mode $ComposeMode -ComposeArguments @("stop", "eqemu-server")

    Copy-Item -LiteralPath $SpirePath -Destination $BackupPath

    $ReplacementInstalled = $true
    Move-Item -LiteralPath $StagedSpirePath -Destination $SpirePath -Force

    Write-Step "Starting AkkStack"
    Invoke-Compose -Mode $ComposeMode -ComposeArguments @("up", "-d", "eqemu-server")
    $ServerStopped = $false

    $ContainerReady = $false
    for ($Attempt = 0; $Attempt -lt 90; $Attempt++) {
        if (Test-SpireService -Mode $ComposeMode) {
            $ContainerReady = $true
            break
        }
        Start-Sleep -Seconds 1
    }

    if (-not $ContainerReady) {
        throw "Spire did not respond after the replacement."
    }

    $ReplacementInstalled = $false

    Write-Host ""
    Write-Host "Spire has been upgraded to the latest Valorith release."
    Write-Host "Open Spire and refresh the page. Future updates can be installed inside Spire."
    Write-Host "Backup: $BackupPath"
}
catch {
    if ($ReplacementInstalled) {
        Write-Warning "Restoring the previous Spire binary..."
        Invoke-Compose -Mode $ComposeMode -ComposeArguments @("stop", "eqemu-server") -IgnoreErrors
        Copy-Item -LiteralPath $BackupPath -Destination $SpirePath -Force
        Invoke-Compose -Mode $ComposeMode -ComposeArguments @("up", "-d", "eqemu-server") -IgnoreErrors
        $ServerStopped = $false
    }
    elseif ($ServerStopped) {
        Invoke-Compose -Mode $ComposeMode -ComposeArguments @("up", "-d", "eqemu-server") -IgnoreErrors
    }

    Write-Error "Upgrade failed. Your previous Spire installation has been preserved. $($_.Exception.Message)"
}
finally {
    foreach ($CleanupPath in @($DownloadZip, $StagedSpirePath, $StagingDirectory)) {
        if (Test-Path -LiteralPath $CleanupPath) {
            Remove-Item -LiteralPath $CleanupPath -Recurse -Force
        }
    }
}
