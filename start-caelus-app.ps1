$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectRoot

if (-not (Test-Path (Join-Path $projectRoot ".env"))) {
  Write-Host "[WARN] .env fehlt. Bitte .env.example nach .env kopieren und anpassen." -ForegroundColor Yellow
}

Write-Host "[INFO] Starte Caelus Server..." -ForegroundColor Cyan
npm.cmd start
