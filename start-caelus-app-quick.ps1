$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectRoot

# Quick mode disables canonical host redirect so temporary tunnel URLs work.
$env:PUBLIC_BASE_URL = ""
$env:ENFORCE_PUBLIC_HOST = "false"
$env:TRUST_PROXY = "true"

Write-Host "[INFO] Starte Caelus Server im Quick-Public-Modus..." -ForegroundColor Cyan
npm.cmd start
