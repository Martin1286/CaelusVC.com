param(
  [string]$ConfigPath = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")).Path "cloudflare\config.yml")
)

$cloudflaredCommand = "cloudflared"
$cloudflared = Get-Command $cloudflaredCommand -ErrorAction SilentlyContinue

if (-not $cloudflared) {
  $fallbackPaths = @(
    "C:\Program Files\cloudflared\cloudflared.exe",
    "C:\Program Files (x86)\cloudflared\cloudflared.exe",
    (Join-Path $env:LOCALAPPDATA "Programs\cloudflared\cloudflared.exe")
  )

  $foundFallback = $fallbackPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($foundFallback) {
    $cloudflaredCommand = $foundFallback
  } else {
    Write-Host "[ERROR] cloudflared nicht gefunden. Installiere es zuerst (z.B. winget install Cloudflare.cloudflared)." -ForegroundColor Red
    exit 1
  }
}

if (-not (Test-Path $ConfigPath)) {
  Write-Host "[ERROR] Config nicht gefunden: $ConfigPath" -ForegroundColor Red
  Write-Host "Kopiere cloudflare/config.example.yml nach cloudflare/config.yml und trage Tunnel-Daten ein." -ForegroundColor Yellow
  exit 1
}

$configContent = Get-Content -Path $ConfigPath -Raw
if ($configContent -match "YOUR_TUNNEL_UUID" -or $configContent -match "YOUR_WINDOWS_USER") {
  Write-Host "[ERROR] cloudflare/config.yml enthaelt noch Platzhalter. Bitte zuerst UUID/User ersetzen." -ForegroundColor Red
  exit 1
}

Write-Host "[INFO] Starte Cloudflare Tunnel mit $ConfigPath" -ForegroundColor Cyan
& $cloudflaredCommand tunnel --config $ConfigPath run
