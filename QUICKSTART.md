# 🚀 SCHNELLSTART — Caelus Online in 10 Minuten

Dein Server funktioniert bereits. Jetzt machen wir ihn online.

## ✅ Was aktuell läuft

- Server: `http://localhost:3000` (lokal funktionierend)
- API-Health: `http://localhost:3000/api/health`
- Voice Chat: funktioniert
- Roblox-Connect-Code: funktioniert

## ❌ Cloudflare-Problem

Dein ISP/Netzwerk blockiert Cloudflare. Lösung: **Render.com** statt Cloudflare = sofort online.

## 📋 5-Schritt-Plan zu einer öffentlichen URL

### Schritt 1: GitHub-Repo erstellen (1 Min)

Gehe zu https://github.com/new und erstelle ein Repo:
- Name: `caelus-voice-chat`
- Public
- Create

Danach kopiere die HTTPS-URL aus dem Repo, z.B.:
```
https://github.com/DEIN_USERNAME/caelus-voice-chat.git
```

### Schritt 2: Zu GitHub pushen (2 Min)

Im PowerShell (im Projekt-Ordner):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-git.ps1 -RepoUrl "https://github.com/DEIN_USERNAME/caelus-voice-chat.git"
```

(Ersetze `DEIN_USERNAME` mit deinem GitHub-Namen)

Danach sollte es sagen: `[DONE] Projekt ist auf GitHub!`

### Schritt 3: Render-Account (1 Min)

Gehe zu https://render.com und melde dich an (Sign up with GitHub).

### Schritt 4: Auf Render deployen (2 Min)

1. Nach Login: Oben rechts "New" → "Web Service"
2. GitHub-Repo verbinden: Wähle `caelus-voice-chat`
3. Free Plan
4. Name: z.B. `caelus-vc` (wird deine URL)
5. Runtime: Node
6. Build Command: `npm install`
7. Start Command: `npm start`

Environment Variables:
```
PUBLIC_BASE_URL=https://caelus-vc.onrender.com
ENFORCE_PUBLIC_HOST=false
TRUST_PROXY=true
ROBLOX_CONNECT_KEY=
```

(Wenn Render dir einen anderen Namen gibt, z.B. `caelus-vc-abc123`, nutze den stattdessen)

8. "Create Web Service"

**Warte 2-3 Minuten.** Render baut und deployed automatisch.

### Schritt 5: Testen (2 Min)

Render zeigt dir deine Live-URL, z.B.: `https://caelus-vc-abc123.onrender.com`

Öffne sie im Browser:
- Seite sollte laden
- Code-Panel sollte sichtbar sein
- `https://caelus-vc-abc123.onrender.com/api/health` → zeigt `{"ok": true, ...}`

### Schritt 6: Roblox-Script anpassen

In `roblox/CaelusConnect.server.lua`, ändere:

```lua
local API_BASE_URL = "https://caelus-vc-abc123.onrender.com"
```

(nutze deine Render-URL)

**Fertig! Alles funktioniert online now.**

## 🔧 Lokales Testen (optional)

Der Server läuft weiterhin lokal. Um lokal zu browsen:

```powershell
npm.cmd start
```

Dann: `http://localhost:3000`

## 🎯 Was danach noch geht

- **Eigene Domain hinzufügen**: Bei Render im Dashboard unter "Custom Domain" einrichten
- **Roblox-Key aktivieren**: `.env` auf Render setzen + `roblox/CaelusConnect.server.lua` anpassen
- **Autoupdate**: Jeden Git-Push deployed Render automatisch neu

## ⚠️ Render Free Plan Limits

- App schläft nach 15 Min Inaktivität (beim Zugriff wieder wach)
- 750 Stunden/Monat (ausreichend für ständige Nutzung)

## 🆘 Probleme?

Falls Render fehlschlägt:
- Prüfe, dass `.env` in `.gitignore` liegt (versteckt die lokale Config)
- Render zeigt Build-Logs → dort nachschauen was falsch ist
- Lokal mit `npm start` noch einmal testen

---

**Viel Erfolg! Bei Fragen ist die README bereit.**
