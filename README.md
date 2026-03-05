# Caelus Proximity Voice Chat (Caelus Revival 2020)

Ein Proximity-Voice-Chat mit zentraler Verbindung: alle Spieler muessen dieselbe URL nutzen, damit sie auf derselben Session sind.

## Was jetzt umgesetzt ist

- Zentraler Connect-Code-Flow fuer Roblox
- API fuer Roblox Claim (`/api/roblox/claim`)
- Zufallscode in der Website (`Code: 123456`)
- Server-Konfig API (`/api/config`)
- Optionale Canonical-Host Erzwingung (`ENFORCE_PUBLIC_HOST=true`)

## Lokal starten (Windows)

1. Installieren:

```powershell
npm.cmd install
```

2. `.env` anlegen (aus `.env.example`):

```env
PORT=3000
PUBLIC_BASE_URL=https://caelusvc.vc
ENFORCE_PUBLIC_HOST=true
TRUST_PROXY=true
ROBLOX_CONNECT_KEY=meinGeheimerKey
```

3. Starten:

```powershell
npm.cmd start
```

## Alle auf einer Connection

Damit wirklich alle verbunden sind:

1. Alle Nutzer muessen exakt dieselbe URL oeffnen (`https://caelusvc.vc`).
2. `PUBLIC_BASE_URL` auf diese URL setzen.
3. `ENFORCE_PUBLIC_HOST=true` lassen, damit falsche Hosts automatisch auf `caelusvc.vc` umgeleitet werden.

Fuer reinen lokalen Test kannst du `ENFORCE_PUBLIC_HOST=false` setzen.

## Hosting Option A: Auf deinem PC (mit Domain)

Das geht, wenn dein PC laeuft und Internet hat. Die komplette Schritt-fuer-Schritt-Anleitung steht in:

- `cloudflare/SETUP.md`

Kurzfassung:

1. `cloudflared` installieren.
2. Setup automatisch ausfuehren:

```powershell
npm.cmd run cloudflare:setup
```

3. Starten:

```powershell
npm.cmd run start:pc-host
```

Wichtige Befehle fuer Schritt 1:

```powershell
cloudflared tunnel login
cloudflared tunnel create caelusvc
cloudflared tunnel route dns caelusvc caelusvc.vc
cloudflared tunnel route dns caelusvc www.caelusvc.vc
```

Das Auto-Setup-Skript (`scripts/setup-cloudflare-tunnel.ps1`) erledigt Login/Setup ebenfalls fuer dich.

Wenn im Browser `DNS_PROBE_FINISHED_NXDOMAIN` steht, ist die Domain oeffentlich noch nicht aufloesbar.
Dann sofortiger Workaround:

```powershell
npm.cmd run start:quick-public
```

Im Tunnel-Terminal erscheint eine URL wie `https://abc123.trycloudflare.com`.
Diese URL funktioniert sofort oeffentlich, auch wenn `caelusvc.vc` noch nicht aktiv ist.

Damit `caelusvc.vc` direkt funktioniert, musst du sicherstellen:

1. Die Domain ist registriert.
2. Die Domain nutzt Cloudflare Nameserver.
3. Der DNS-Eintrag wurde ueber `cloudflared tunnel route dns ...` gesetzt.
4. DNS-Propagation ist abgeschlossen.

## Hosting Option B: Gratis Service (Render)

Datei `render.yaml` ist vorbereitet.

1. Projekt auf GitHub pushen.
2. Bei Render "New Web Service" aus dem Repo erstellen.
3. Free Plan waehlen.
4. Env Vars setzen:

```text
PUBLIC_BASE_URL=https://caelusvc.onrender.com
ENFORCE_PUBLIC_HOST=true
TRUST_PROXY=true
ROBLOX_CONNECT_KEY=deinKey
```

5. Ergebnis ist z. B. `https://caelusvc.onrender.com`.

Hinweis: Eine eigene Domain ist in der Regel nicht kostenlos. Wenn du `caelusvc.vc` nutzen willst, musst du die Domain besitzen und dann auf den Host zeigen lassen.

## Roblox verbinden (Code-Flow)

1. In der Website Voice Chat starten.
2. Code ablesen (`Code: 123456`).
3. In Roblox Chat eingeben:

```text
/caelus 123456
```

## Roblox Setup

1. `roblox/CaelusConnect.server.lua` nach `ServerScriptService`.
2. `roblox/CaelusConnect.client.lua` nach `StarterPlayerScripts`.
3. In Roblox `HttpService` aktivieren (`Game Settings -> Security -> Enable HTTP Requests`).
4. In `roblox/CaelusConnect.server.lua` URL und Key setzen:

```lua
local API_BASE_URL = "https://caelusvc.vc"
local API_KEY = "meinGeheimerKey"
```

## EXE bauen (Windows)

```powershell
npm.cmd run build:exe
.\dist\caelus-proximity-voice-chat.exe
```

## Wichtiger Hinweis fuer Roblox

Roblox erreicht kein `localhost`. Du brauchst immer eine oeffentliche HTTPS-URL.

