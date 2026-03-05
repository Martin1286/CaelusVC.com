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
    Write-Host "[ERROR] cloudflared nicht gefunden." -ForegroundColor Red
    exit 1
  }
}

Write-Host "[INFO] Starte Quick Tunnel..." -ForegroundColor Cyan
Write-Host "[INFO] Kopiere die URL aus der Ausgabe (https://....trycloudflare.com)." -ForegroundColor Yellow
& $cloudflaredCommand tunnel --url http://localhost:3000
