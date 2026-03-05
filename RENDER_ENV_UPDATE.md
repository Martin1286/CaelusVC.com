# 🔧 Render Deployment - Umgebungsvariablen updaten

Deine Render-URL: `https://caelusvc-com-1.onrender.com`

## Schritt 1: Im Render Dashboard

1. Gehe zu https://dashboard.render.com
2. Finde dein Web Service (z.B. "caelusvc-com")
3. Klick auf "Environment"
4. Ersetze die Environment Variables mit:

```
PUBLIC_BASE_URL=https://caelusvc-com-1.onrender.com
ENFORCE_PUBLIC_HOST=true
TRUST_PROXY=true
ROBLOX_CONNECT_KEY=
```

5. **Speichern** ("Deploy new changes") — Server startet neu

## Schritt 2: Warten

Der Server wird neu deployed. Das dauert 1-2 Min.

## Schritt 3: Testen

Nach 2 Min:

```
https://caelusvc-com-1.onrender.com
https://caelusvc-com-1.onrender.com/api/health
https://caelusvc-com-1.onrender.com/api/config
```

Sollte laden und JSON zeigen.

## Schritt 4: Git+Local updaten (optional)

Damit auch lokal alles stimmt, pushe die Änderungen zu GitHub:

```powershell
git add .
git commit -m "Update: Render Live URL"
git push
```

Render deployed dann automatisch neu.

## Schritt 5: Roblox-Script

In Roblox, im `CaelusConnect.server.lua`:

```lua
local API_BASE_URL = "https://caelusvc-com-1.onrender.com"
local API_KEY = ""
```

Speichern. Fertig!

---

Nach diesen Schritten ist alles live und Roblox kann sich connecten.
