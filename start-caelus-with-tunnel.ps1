$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$appScript = Join-Path $projectRoot "scripts\start-caelus-app.ps1"
$tunnelScript = Join-Path $projectRoot "scripts\start-cloudflare-tunnel.ps1"
$customDomain = "caelusvc.vc"

if (-not (Test-Path $appScript)) {
  Write-Host "[ERROR] Script fehlt: $appScript" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $tunnelScript)) {
  Write-Host "[ERROR] Script fehlt: $tunnelScript" -ForegroundColor Red
  exit 1
}

$dnsCheck = Resolve-DnsName $customDomain -ErrorAction SilentlyContinue
if (-not $dnsCheck) {
  Write-Host "[WARN] $customDomain ist aktuell nicht im DNS aufloesbar (NXDOMAIN moeglich)." -ForegroundColor Yellow
  Write-Host "[WARN] Sofortiger Fallback: npm.cmd run start:quick-public" -ForegroundColor Yellow
}

Write-Host "[INFO] Oeffne Server-Terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", ('"' + $appScript + '"') -WorkingDirectory $projectRoot

Start-Sleep -Seconds 2

Write-Host "[INFO] Oeffne Tunnel-Terminal..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", ('"' + $tunnelScript + '"') -WorkingDirectory $projectRoot

Write-Host "[DONE] Beide Prozesse wurden gestartet." -ForegroundColor Green
