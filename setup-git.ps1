param(
  [string]$RepoUrl = ""
)

if (-not $RepoUrl) {
  Write-Host "Syntax: .\setup-git.ps1 -RepoUrl 'https://github.com/YOUR_USERNAME/caelus-voice-chat.git'" -ForegroundColor Yellow
  Write-Host "" -ForegroundColor Yellow
  Write-Host "Schritte zur Vorbereitung:" -ForegroundColor Cyan
  Write-Host "1. GitHub-Repo erstellen: https://github.com/new" -ForegroundColor White
  Write-Host "2. Copy URL (HTTPS)" -ForegroundColor White
  Write-Host "3. Dann laden: .\scripts\setup-git.ps1 -RepoUrl 'https://github.com/YOUR_USERNAME/caelus-voice-chat.git'" -ForegroundColor White
  exit 0
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $projectRoot

try {
  Write-Host "[INFO] Initialisiere Git..." -ForegroundColor Cyan
  git init

  Write-Host "[INFO] Addiere alle Dateien..." -ForegroundColor Cyan
  git add .

  Write-Host "[INFO] Erstelle initialen Commit..." -ForegroundColor Cyan
  git commit -m "Initial commit: Caelus Proximity Voice Chat"

  Write-Host "[INFO] Benenne main branch..." -ForegroundColor Cyan
  git branch -M main

  Write-Host "[INFO] Addiere Remote..." -ForegroundColor Cyan
  git remote add origin $RepoUrl

  Write-Host "[INFO] Pushe zu GitHub..." -ForegroundColor Cyan
  git push -u origin main

  Write-Host "[DONE] Projekt ist auf GitHub!" -ForegroundColor Green
  Write-Host "[NEXT] Render-Deployment: https://render.com -> Web Service -> Connect this Repo" -ForegroundColor Green
} catch {
  Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
