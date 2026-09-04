[CmdletBinding()]
param(
    [string]$SpireDirectory = (Get-Location).Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ReleaseApiUrl = "https://api.github.com/repos/Valorith/spire/releases?per_page=100"
$ReleaseAssetName = "spire-windows-amd64.exe.zip"
$ReleaseBinaryName = "spire-windows-amd64.exe"

if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) {
    throw "curl.exe is required to update Spire."
}

try {
    $ResolvedSpireDirectory = (Resolve-Path -LiteralPath $SpireDirectory).Path
}
catch {
    throw "Spire directory not found: $SpireDirectory"
}

$ReleaseJson = & curl.exe `
    -fsSL `
    --retry 3 `
    -H "Accept: application/vnd.github+json" `
    -H "User-Agent: Spire-Updater" `
    $ReleaseApiUrl
if ($LASTEXITCODE -ne 0) {
    throw "Could not load Spire releases."
}

$Releases = ConvertFrom-Json -InputObject ($ReleaseJson -join "`n")
$Candidates = foreach ($Release in $Releases) {
    if ($Release.draft -or $Release.assets.name -notcontains $ReleaseAssetName) {
        continue
    }

    try {
        $Version = [version]($Release.tag_name -replace "^v", "")
    }
    catch {
        continue
    }

    [pscustomobject]@{
        Release = $Release
        Version = $Version
    }
}

$Selected = $Candidates | Sort-Object Version -Descending | Select-Object -First 1
if (-not $Selected) {
    throw "No compatible Spire release was found."
}

$Release = $Selected.Release
$ReleaseAsset = $Release.assets |
    Where-Object { $_.name -eq $ReleaseAssetName } |
    Select-Object -First 1
$TargetName = if (Test-Path -LiteralPath (Join-Path $ResolvedSpireDirectory "spire.exe")) {
    "spire.exe"
}
elseif (Test-Path -LiteralPath (Join-Path $ResolvedSpireDirectory $ReleaseBinaryName)) {
    $ReleaseBinaryName
}
else {
    "spire.exe"
}

$TargetPath = Join-Path $ResolvedSpireDirectory $TargetName
$UpdateStamp = (Get-Date -Format "yyyyMMdd-HHmmss") + "-" + [guid]::NewGuid().ToString("N").Substring(0, 8)
$BackupPath = $null
$TempDirectory = Join-Path ([IO.Path]::GetTempPath()) ("spire-update-" + [guid]::NewGuid())
$StagedTargetPath = "$TargetPath.spire-update-$UpdateStamp.new"

New-Item -ItemType Directory -Path $TempDirectory | Out-Null
try {
    $DownloadPath = Join-Path $TempDirectory $ReleaseAssetName
    & curl.exe `
        -fL `
        --retry 3 `
        --show-error `
        --silent `
        $ReleaseAsset.browser_download_url `
        -o $DownloadPath
    if ($LASTEXITCODE -ne 0) {
        throw "Could not download $ReleaseAssetName."
    }

    Expand-Archive -LiteralPath $DownloadPath -DestinationPath $TempDirectory -Force
    $ExtractedBinaryPath = Join-Path $TempDirectory $ReleaseBinaryName
    if (-not (Test-Path -LiteralPath $ExtractedBinaryPath -PathType Leaf) -or
        (Get-Item -LiteralPath $ExtractedBinaryPath).Length -eq 0) {
        throw "The release archive did not contain a usable $ReleaseBinaryName."
    }

    Copy-Item -LiteralPath $ExtractedBinaryPath -Destination $StagedTargetPath
    if (Test-Path -LiteralPath $TargetPath -PathType Leaf) {
        $BackupPath = "$TargetPath.before-$UpdateStamp"
        Copy-Item -LiteralPath $TargetPath -Destination $BackupPath
    }

    Move-Item -LiteralPath $StagedTargetPath -Destination $TargetPath -Force

    Write-Host "Installed Spire $($Release.tag_name) to $TargetPath"
    if ($BackupPath) {
        Write-Host "Backup: $BackupPath"
    }
}
finally {
    if (Test-Path -LiteralPath $StagedTargetPath) {
        Remove-Item -LiteralPath $StagedTargetPath -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $TempDirectory) {
        Remove-Item -LiteralPath $TempDirectory -Recurse -Force -ErrorAction SilentlyContinue
    }
}
