# Cloudflare Tunnel Setup fuer `caelusvc.vc`

Voraussetzung: Die Domain `caelusvc.vc` liegt in deinem Cloudflare-Account und nutzt Cloudflare Nameserver.

## 1) cloudflared installieren (Windows)

```powershell
winget install --id Cloudflare.cloudflared -e
```

Pruefen:

```powershell
cloudflared --version
```

Wenn der Befehl direkt nach Installation noch nicht erkannt wird, Terminal neu starten oder den absoluten Pfad nutzen:

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" --version
```

## Schnellstart (automatisch)

Im Projektordner:

```powershell
npm.cmd run cloudflare:setup
```

Das Skript erledigt:

- Cloudflare Login (Browser)
- Tunnel-Erstellung (oder Wiederverwendung)
- DNS-Routen fuer `caelusvc.vc` und `www.caelusvc.vc`
- `cloudflare/config.yml` mit Tunnel-ID
- `.env` mit `PUBLIC_BASE_URL=https://caelusvc.vc`

Danach starten:

```powershell
npm.cmd run start:pc-host
```

Wenn du lieber alles manuell machst, nutze die Schritte unten.

## 2) Bei Cloudflare einloggen (Tunnel Auth)

```powershell
cloudflared tunnel login
```

Dadurch wird ein Browserfenster geoeffnet.

## 3) Tunnel erstellen

```powershell
cloudflared tunnel create caelusvc
```

Die Ausgabe enthaelt eine Tunnel-ID (UUID), z. B. `12345678-abcd-1234-abcd-1234567890ab`.

## 4) DNS auf Tunnel zeigen lassen

```powershell
cloudflared tunnel route dns caelusvc caelusvc.vc
cloudflared tunnel route dns caelusvc www.caelusvc.vc
```

## 5) Tunnel-Config im Projekt anlegen

1. `cloudflare/config.example.yml` nach `cloudflare/config.yml` kopieren.
2. Ersetzen:
- `YOUR_TUNNEL_UUID`
- `YOUR_WINDOWS_USER`

Beispiel:

```yml
tunnel: 12345678-abcd-1234-abcd-1234567890ab
credentials-file: C:\Users\lospash\.cloudflared\12345678-abcd-1234-abcd-1234567890ab.json

ingress:
  - hostname: caelusvc.vc
    service: http://localhost:3000
  - hostname: www.caelusvc.vc
    service: http://localhost:3000
  - service: http_status:404
```

## 6) App-Umgebung setzen

Kopiere `.env.example` nach `.env` und nutze:

```env
PORT=3000
PUBLIC_BASE_URL=https://caelusvc.vc
ENFORCE_PUBLIC_HOST=true
TRUST_PROXY=true
ROBLOX_CONNECT_KEY=deinStarkerKey
```

## 7) Starten

Variante A (ein Kommando):

```powershell
npm.cmd run start:pc-host
```

Variante B (getrennt):

```powershell
npm.cmd start
npm.cmd run tunnel:run
```

## 8) Testen

- Browser: `https://caelusvc.vc`
- Health: `https://caelusvc.vc/api/health`
- Config: `https://caelusvc.vc/api/config`

Wenn diese Endpunkte erreichbar sind, sind alle Nutzer auf derselben zentralen Connection.

## Fehlerbild: NXDOMAIN

Wenn `https://caelusvc.vc` `DNS_PROBE_FINISHED_NXDOMAIN` zeigt, ist die Domain global noch nicht aufloesbar.

Sofort funktionierender Workaround:

```powershell
npm.cmd run start:quick-public
```

Nutze dann die angezeigte `https://...trycloudflare.com` URL aus dem Tunnel-Terminal.

Damit `caelusvc.vc` spaeter funktioniert:

1. Domain registriert?
2. Domain-Namesserver auf Cloudflare gesetzt?
3. `cloudflared tunnel route dns` erfolgreich ausgefuehrt?
4. DNS-Propagation abgewartet?

