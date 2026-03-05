$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$appScript = Join-Path $projectRoot "scripts\start-caelus-app-quick.ps1"
$tunnelScript = Join-Path $projectRoot "scripts\start-cloudflare-quick-tunnel.ps1"

if (-not (Test-Path $appScript)) {
  Write-Host "[ERROR] Script fehlt: $appScript" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $tunnelScript)) {
  Write-Host "[ERROR] Script fehlt: $tunnelScript" -ForegroundColor Red
  exit 1
}

Write-Host "[INFO] Oeffne Server-Terminal (Quick-Modus)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", ('"' + $appScript + '"') -WorkingDirectory $projectRoot

Start-Sleep -Seconds 2

Write-Host "[INFO] Oeffne Quick-Tunnel-Terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", ('"' + $tunnelScript + '"') -WorkingDirectory $projectRoot

Write-Host "[DONE] Quick Public Modus gestartet. Nutze die trycloudflare.com URL aus dem Tunnel-Terminal." -ForegroundColor Green
