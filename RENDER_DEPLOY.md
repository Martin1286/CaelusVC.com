# Render-Deployment (Sofort funktionierend!)

Wenn Cloudflare nicht funktioniert, deploy zu Render stattdessen. Das geht in 5 Minuten.

## Schritt 1: GitHub-Repo erstellen

1. Gehe zu https://github.com/new
2. Repo-Name: `caelus-voice-chat`
3. Public (damit Render es sieht)
4. Create

## Schritt 2: Projekt zu GitHub pushen

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/caelus-voice-chat.git
git push -u origin main
```

(Ersetze `YOUR_USERNAME` mit deinem GitHub-Namen)

## Schritt 3: Render-Account

1. Gehe zu https://render.com
2. Melde dich mit GitHub an (Sign up with GitHub)

## Schritt 4: Deploy auf Render

1. Nach Login: "New" → "Web Service"
2. Verbinde dein Repo `caelus-voice-chat`
3. Wähle Free Plan
4. Environment Vars setzen:

```
PUBLIC_BASE_URL=https://YOUR-APP.onrender.com
ENFORCE_PUBLIC_HOST=false
TRUST_PROXY=true
ROBLOX_CONNECT_KEY=
```

(Ersetze `YOUR-APP` mit deinem App-Namen von Render, z.B. `caelus-vc-123`)

5. "Create Web Service"

Dann **warte 2-3 Minuten**. Render baut und startet die App.

## Schritt 5: Testen

Render gibt dir eine URL wie: `https://caelus-vc-123.onrender.com`

Öffne sie im Browser:
- `https://caelus-vc-123.onrender.com`
- `https://caelus-vc-123.onrender.com/api/health`

## Schritt 6: Roblox-Script anpassen

In `roblox/CaelusConnect.server.lua`:

```lua
local API_BASE_URL = "https://caelus-vc-123.onrender.com"
```

Fertig! Jetzt funktioniert Alles online.

## Lokales Backup

Der Server läuft noch lokal auf `http://localhost:3000` zum Testen.

## Später: Eigene Domain

Wenn du `caelusvc.vc` oder eine andere Domain willst, kannst du sie später zu Render zeigen (via CNAME).
