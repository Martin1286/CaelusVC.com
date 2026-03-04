# Caelus Proximity Voice Chat (Caelus Revival 2020)

Ein leichtgewichtiges Proximity-Voice-Chat-System mit Node.js, Socket.IO und WebRTC.

## Funktionen

- Live-Sprachchat zwischen allen verbundenen Spielern
- Distanzbasierte Lautstaerke (naeher = lauter, weiter weg = leiser)
- Spieler bewegen sich auf einer 2D-Karte mit `WASD` oder Pfeiltasten
- Stummschalten des eigenen Mikrofons per Button

## Start (Windows)

1. Abhaengigkeiten installieren:

```powershell
npm.cmd install
```

2. Server starten:

```powershell
npm.cmd start
```

3. Im Browser oeffnen:

```text
http://localhost:3000
```

4. Fuer Tests mindestens zwei Browser-Tabs oder zwei Geraete verbinden.

## EXE bauen (Windows)

1. EXE erstellen:

```powershell
npm.cmd run build:exe
```

2. EXE starten:

```powershell
.\dist\caelus-proximity-voice-chat.exe
```

3. Danach im Browser oeffnen:

```text
http://localhost:3000
```

## Roblox verbinden (Code-Flow)

Die App erzeugt nach dem Beitritt einen Zufallscode im Bereich `Code: 123456`.

In Roblox gibst du diesen Code im Chat ein:

```text
/caelus 123456
```

### Roblox Setup

1. `roblox/CaelusConnect.server.lua` in `ServerScriptService` einfuergen.
2. `roblox/CaelusConnect.client.lua` in `StarterPlayerScripts` einfuergen.
3. In `CaelusConnect.server.lua` die URL setzen:

```lua
local API_BASE_URL = "https://DEINE-OEFFENTLICHE-URL"
```

4. In Roblox `HttpService` aktivieren (`Game Settings -> Security -> Enable HTTP Requests`).
5. Falls du einen Schutz-Key nutzt, denselben Key in App und Roblox eintragen.

### Optionaler Schutz-Key

Server mit Key starten:

```powershell
$env:ROBLOX_CONNECT_KEY="meinGeheimerKey"; npm.cmd start
```

Und in `CaelusConnect.server.lua` setzen:

```lua
local API_KEY = "meinGeheimerKey"
```

### Wichtiger Hinweis

Roblox kann nicht auf `localhost` zugreifen. Fuer echte Roblox-Server muss die App unter einer oeffentlichen HTTPS-URL laufen.

## Technik

- Signaling: Socket.IO (`voice:offer`, `voice:answer`, `voice:ice`)
- Medien: WebRTC (`RTCPeerConnection`, `getUserMedia`)
- Proximity: Lautstaerke wird aus Distanz auf der Karte berechnet

## Hinweis fuer Internetbetrieb

Im lokalen Netz funktioniert STUN oft direkt. Fuer stabile Verbindungen ueber Internet brauchst du in der Regel zusaetzlich einen TURN-Server.
