param(
  [string]$Domain = "caelusvc.vc",
  [string]$TunnelName = "caelusvc",
  [string]$RobloxConnectKey = "",
  [switch]$SkipLogin
)

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$configPath = Join-Path $projectRoot "cloudflare\config.yml"
$configExamplePath = Join-Path $projectRoot "cloudflare\config.example.yml"
$envPath = Join-Path $projectRoot ".env"
$envExamplePath = Join-Path $projectRoot ".env.example"

function Resolve-CloudflaredCommand {
  $command = Get-Command cloudflared -ErrorAction SilentlyContinue
  if ($command) {
    return "cloudflared"
  }

  $fallbackPaths = @(
    "C:\Program Files\cloudflared\cloudflared.exe",
    "C:\Program Files (x86)\cloudflared\cloudflared.exe",
    (Join-Path $env:LOCALAPPDATA "Programs\cloudflared\cloudflared.exe")
  )

  $path = $fallbackPaths | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $path) {
    throw "cloudflared nicht gefunden. Bitte zuerst installieren."
  }

  return $path
}

function Set-OrAddEnvValue {
  param(
    [string]$Content,
    [string]$Name,
    [string]$Value
  )

  $pattern = "(?m)^" + [regex]::Escape($Name) + "=.*$"
  $line = "$Name=$Value"

  if ([regex]::IsMatch($Content, $pattern)) {
    return [regex]::Replace($Content, $pattern, $line)
  }

  $trimmed = $Content.TrimEnd("`r", "`n")
  if ($trimmed.Length -eq 0) {
    return $line + "`r`n"
  }

  return $trimmed + "`r`n" + $line + "`r`n"
}

function Get-OrCreateTunnelId {
  param(
    [string]$Cloudflared,
    [string]$Name
  )

  $listOutput = & $Cloudflared tunnel list --output json 2>$null
  if ($LASTEXITCODE -eq 0 -and $listOutput) {
    try {
      $tunnels = $listOutput | ConvertFrom-Json
      $existing = $tunnels | Where-Object { $_.name -eq $Name } | Select-Object -First 1
      if ($existing -and $existing.id) {
        return [string]$existing.id
      }
    } catch {
      Write-Host "[WARN] Tunnel-Liste konnte nicht geparsed werden. Erstelle neuen Tunnel..." -ForegroundColor Yellow
    }
  }

  $createOutput = (& $Cloudflared tunnel create $Name 2>&1 | Out-String)
  if ($LASTEXITCODE -ne 0) {
    throw "Tunnel konnte nicht erstellt werden.`n$createOutput"
  }

  $uuidRegex = [regex]"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
  $match = $uuidRegex.Match($createOutput)
  if (-not $match.Success) {
    throw "Tunnel-ID konnte nicht aus Ausgabe gelesen werden.`n$createOutput"
  }

  return $match.Value
}

try {
  $cloudflared = Resolve-CloudflaredCommand
  Write-Host "[INFO] Verwende cloudflared: $cloudflared" -ForegroundColor Cyan

  if (-not (Test-Path $configPath)) {
    if (-not (Test-Path $configExamplePath)) {
      throw "Config-Template fehlt: $configExamplePath"
    }

    Copy-Item -Path $configExamplePath -Destination $configPath -Force
    Write-Host "[INFO] cloudflare/config.yml aus Template erstellt." -ForegroundColor Cyan
  }

  if (-not (Test-Path $envPath) -and (Test-Path $envExamplePath)) {
    Copy-Item -Path $envExamplePath -Destination $envPath -Force
    Write-Host "[INFO] .env aus .env.example erstellt." -ForegroundColor Cyan
  }

  if (-not $SkipLogin) {
    Write-Host "[INFO] Cloudflare Login startet (Browser)." -ForegroundColor Cyan
    & $cloudflared tunnel login
    if ($LASTEXITCODE -ne 0) {
      throw "cloudflared tunnel login fehlgeschlagen."
    }
  }

  $tunnelId = Get-OrCreateTunnelId -Cloudflared $cloudflared -Name $TunnelName
  Write-Host "[INFO] Tunnel-ID: $tunnelId" -ForegroundColor Green

  & $cloudflared tunnel route dns $TunnelName $Domain
  if ($LASTEXITCODE -ne 0) {
    throw "DNS Route fuer $Domain fehlgeschlagen."
  }

  & $cloudflared tunnel route dns $TunnelName ("www." + $Domain)
  if ($LASTEXITCODE -ne 0) {
    throw "DNS Route fuer www.$Domain fehlgeschlagen."
  }

  $configContent = Get-Content -Path $configPath -Raw
  $updatedConfigContent = $configContent.Replace("YOUR_TUNNEL_UUID", $tunnelId)
  $updatedConfigContent = $updatedConfigContent.Replace("YOUR_WINDOWS_USER", $env:USERNAME)
  if ($updatedConfigContent -ne $configContent) {
    try {
      Set-Content -Path $configPath -Value $updatedConfigContent -Encoding ascii
    } catch {
      throw "cloudflare/config.yml konnte nicht aktualisiert werden. Stoppe laufende Tunnel-Prozesse und versuche es erneut."
    }
  }

  if (Test-Path $envPath) {
    $envContent = Get-Content -Path $envPath -Raw
    $envContent = Set-OrAddEnvValue -Content $envContent -Name "PUBLIC_BASE_URL" -Value ("https://" + $Domain)
    $envContent = Set-OrAddEnvValue -Content $envContent -Name "ENFORCE_PUBLIC_HOST" -Value "true"
    $envContent = Set-OrAddEnvValue -Content $envContent -Name "TRUST_PROXY" -Value "true"
    if ($RobloxConnectKey -ne "") {
      $envContent = Set-OrAddEnvValue -Content $envContent -Name "ROBLOX_CONNECT_KEY" -Value $RobloxConnectKey
    }
    Set-Content -Path $envPath -Value $envContent -Encoding ascii
  }

  Write-Host "[DONE] Cloudflare Tunnel ist vorbereitet." -ForegroundColor Green
  Write-Host "[NEXT] Starte jetzt: npm.cmd run start:pc-host" -ForegroundColor Green
} catch {
  Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

