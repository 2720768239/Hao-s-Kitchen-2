$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backupDir = Join-Path $root "backups"
$dataDir = Join-Path $root "data"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $backupDir "hao-kitchen-$stamp.zip"

if (-not (Test-Path -LiteralPath $dataDir)) {
  throw "No data directory found at $dataDir"
}

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$items = @(
  (Join-Path $dataDir "hao-kitchen.sqlite"),
  (Join-Path $dataDir "uploads")
)

Compress-Archive -LiteralPath $items -DestinationPath $target -Force
Write-Host "Backup written to $target"
