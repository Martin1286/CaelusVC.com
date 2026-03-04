const socket = io({ autoConnect: false });

const mapEl = document.getElementById("map");
const joinBtn = document.getElementById("joinBtn");
const muteBtn = document.getElementById("muteBtn");
const displayNameInput = document.getElementById("displayName");
const connectionStateEl = document.getElementById("connectionState");
const onlineCountEl = document.getElementById("onlineCount");
const connectCodeEl = document.getElementById("connectCode");
const refreshCodeBtn = document.getElementById("refreshCodeBtn");
const connectInfoEl = document.getElementById("connectInfo");

const players = new Map();
const playerElements = new Map();
const peers = new Map();
const keysDown = new Set();

const MOVE_SPEED = 240;
const POSITION_SEND_INTERVAL_MS = 66;
const MAX_HEARING_DISTANCE = 350;
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

let selfId = null;
let localStream = null;
let muted = false;
let mapSize = { width: 1200, height: 800 };
let lastTick = performance.now();
let lastPositionSend = 0;
let currentConnectCode = null;

function setConnectCode(code) {
  currentConnectCode = code || null;
  connectCodeEl.textContent = code || "------";
}

function setConnectInfo(text, tone = "neutral") {
  connectInfoEl.textContent = text;
  connectInfoEl.classList.toggle("success", tone === "success");
  connectInfoEl.classList.toggle("error", tone === "error");
}

function requestConnectCode() {
  if (!socket.connected || !selfId) {
    return;
  }

  refreshCodeBtn.disabled = true;
  setConnectInfo("Code wird erzeugt...", "neutral");
  socket.emit("link:requestCode");
}

function setStatus(text, active = false) {
  connectionStateEl.textContent = text;
  connectionStateEl.classList.toggle("active", active);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateOnlineCount() {
  onlineCountEl.textContent = String(players.size);
}

function createPlayerElement(id) {
  const element = document.createElement("div");
  element.className = "player-dot";

  const label = document.createElement("span");
  label.className = "player-name";

  element.appendChild(label);
  mapEl.appendChild(element);
  playerElements.set(id, element);

  return element;
}

function renderPlayer(id) {
  const player = players.get(id);
  if (!player) {
    return;
  }

  const element = playerElements.get(id) || createPlayerElement(id);
  const xPercent = (player.x / mapSize.width) * 100;
  const yPercent = (player.y / mapSize.height) * 100;

  element.style.left = `${xPercent}%`;
  element.style.top = `${yPercent}%`;
  element.classList.toggle("self", id === selfId);

  const label = element.querySelector(".player-name");
  label.textContent = id === selfId ? `${player.name} (Du)` : player.name;
}

function removePlayerElement(id) {
  const element = playerElements.get(id);
  if (!element) {
    return;
  }

  element.remove();
  playerElements.delete(id);
}

function renderAllPlayers() {
  for (const id of players.keys()) {
    renderPlayer(id);
  }

  for (const [id] of playerElements) {
    if (!players.has(id)) {
      removePlayerElement(id);
    }
  }
}

function getDirectionVector() {
  let x = 0;
  let y = 0;

  if (keysDown.has("a") || keysDown.has("arrowleft")) {
    x -= 1;
  }

  if (keysDown.has("d") || keysDown.has("arrowright")) {
    x += 1;
  }

  if (keysDown.has("w") || keysDown.has("arrowup")) {
    y -= 1;
  }

  if (keysDown.has("s") || keysDown.has("arrowdown")) {
    y += 1;
  }

  const length = Math.hypot(x, y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }

  return { x: x / length, y: y / length };
}

function getSelfPlayer() {
  if (!selfId) {
    return null;
  }
  return players.get(selfId) || null;
}

function computeVolume(distance) {
  if (distance >= MAX_HEARING_DISTANCE) {
    return 0;
  }

  const normalized = 1 - distance / MAX_HEARING_DISTANCE;
  return normalized * normalized;
}

function updatePeerVolumes() {
  const self = getSelfPlayer();
  if (!self) {
    return;
  }

  for (const [peerId, peer] of peers) {
    const remotePlayer = players.get(peerId);
    if (!remotePlayer) {
      peer.audio.volume = 0;
      continue;
    }

    const distance = Math.hypot(remotePlayer.x - self.x, remotePlayer.y - self.y);
    peer.audio.volume = computeVolume(distance);
  }
}

async function ensurePeer(peerId, shouldCreateOffer) {
  if (!peerId || peerId === selfId) {
    return null;
  }

  const existing = peers.get(peerId);
  if (existing) {
    if (shouldCreateOffer && !existing.madeOffer) {
      const offer = await existing.pc.createOffer();
      await existing.pc.setLocalDescription(offer);
      socket.emit("voice:offer", { to: peerId, description: existing.pc.localDescription });
      existing.madeOffer = true;
    }
    return existing;
  }

  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.playsInline = true;
  audio.volume = 0;
  audio.dataset.peerId = peerId;
  document.body.appendChild(audio);

  if (localStream) {
    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
  }

  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) {
      audio.srcObject = stream;
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("voice:ice", { to: peerId, candidate: event.candidate });
    }
  };

  pc.onconnectionstatechange = () => {
    if (["failed", "closed"].includes(pc.connectionState)) {
      cleanupPeer(peerId);
    }
  };

  const peer = {
    pc,
    audio,
    madeOffer: false
  };

  peers.set(peerId, peer);

  if (shouldCreateOffer) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("voice:offer", { to: peerId, description: pc.localDescription });
    peer.madeOffer = true;
  }

  return peer;
}

function cleanupPeer(peerId) {
  const peer = peers.get(peerId);
  if (!peer) {
    return;
  }

  try {
    peer.pc.close();
  } catch (error) {
    console.error("peer close error", error);
  }

  peer.audio.remove();
  peers.delete(peerId);
}

function cleanupAllPeers() {
  for (const peerId of peers.keys()) {
    cleanupPeer(peerId);
  }
}

async function startVoiceChat() {
  if (localStream) {
    return;
  }

  const name = (displayNameInput.value || "Gast").trim().slice(0, 24) || "Gast";

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });

    socket.connect();
    socket.emit("join", { name });

    joinBtn.disabled = true;
    muteBtn.disabled = false;
    displayNameInput.disabled = true;
    setStatus("Verbunden - Mikrofon aktiv", true);
  } catch (error) {
    console.error(error);
    setStatus("Fehler: Mikrofonzugriff nicht moeglich", false);
  }
}

function toggleMute() {
  if (!localStream) {
    return;
  }

  muted = !muted;
  for (const track of localStream.getAudioTracks()) {
    track.enabled = !muted;
  }

  muteBtn.textContent = muted ? "Mikrofon aktivieren" : "Mikrofon stummschalten";
  setStatus(muted ? "Verbunden - Mikrofon aus" : "Verbunden - Mikrofon aktiv", true);
}

joinBtn.addEventListener("click", () => {
  void startVoiceChat();
});

muteBtn.addEventListener("click", toggleMute);
refreshCodeBtn.addEventListener("click", requestConnectCode);

displayNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void startVoiceChat();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) {
    return;
  }

  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    keysDown.add(key);
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keysDown.delete(event.key.toLowerCase());
});

socket.on("connect", () => {
  if (localStream) {
    setStatus("Verbunden - Mikrofon aktiv", true);
  }
});

socket.on("disconnect", () => {
  setStatus("Verbindung getrennt", false);
  setConnectCode(null);
  setConnectInfo("Verbindung getrennt. Nach Reconnect neuen Code erzeugen.", "error");
  refreshCodeBtn.disabled = true;
});

socket.on("joined", async ({ self, users, map }) => {
  mapSize = map || mapSize;
  selfId = self.id;

  players.set(self.id, self);
  for (const user of users) {
    players.set(user.id, user);
  }

  renderAllPlayers();
  updateOnlineCount();

  for (const user of users) {
    await ensurePeer(user.id, true);
  }

  requestConnectCode();
});

socket.on("user:joined", (user) => {
  players.set(user.id, user);
  renderPlayer(user.id);
  updateOnlineCount();
});

socket.on("user:moved", ({ id, x, y }) => {
  const player = players.get(id);
  if (!player) {
    return;
  }

  player.x = x;
  player.y = y;
  renderPlayer(id);
});

socket.on("user:left", ({ id }) => {
  players.delete(id);
  removePlayerElement(id);
  cleanupPeer(id);
  updateOnlineCount();
});

socket.on("voice:offer", async ({ from, description }) => {
  try {
    const peer = await ensurePeer(from, false);
    if (!peer) {
      return;
    }

    await peer.pc.setRemoteDescription(description);
    const answer = await peer.pc.createAnswer();
    await peer.pc.setLocalDescription(answer);

    socket.emit("voice:answer", {
      to: from,
      description: peer.pc.localDescription
    });
  } catch (error) {
    console.error("voice offer error", error);
  }
});

socket.on("voice:answer", async ({ from, description }) => {
  const peer = peers.get(from);
  if (!peer) {
    return;
  }

  try {
    await peer.pc.setRemoteDescription(description);
  } catch (error) {
    console.error("voice answer error", error);
  }
});

socket.on("voice:ice", async ({ from, candidate }) => {
  const peer = peers.get(from);
  if (!peer || !candidate) {
    return;
  }

  try {
    await peer.pc.addIceCandidate(candidate);
  } catch (error) {
    console.error("ice candidate error", error);
  }
});

socket.on("link:code", ({ code, expiresInSeconds }) => {
  setConnectCode(code);
  refreshCodeBtn.disabled = false;

  const validSeconds = Number(expiresInSeconds) || 0;
  const validMinutes = Math.max(1, Math.floor(validSeconds / 60));
  setConnectInfo(
    `In Roblox eingeben: /caelus ${code} (gueltig ca. ${validMinutes} min)`,
    "success"
  );
});

socket.on("link:claimed", ({ robloxUsername, robloxUserId, placeId }) => {
  const identity = robloxUsername || `User ${robloxUserId || "Unbekannt"}`;
  setConnectInfo(`Verbunden mit Roblox: ${identity} (PlaceId ${placeId || 0})`, "success");
  refreshCodeBtn.disabled = false;
});

socket.on("link:error", ({ message }) => {
  setConnectInfo(message || "Code konnte nicht erstellt werden", "error");
  refreshCodeBtn.disabled = false;
});

function tick(now) {
  const delta = (now - lastTick) / 1000;
  lastTick = now;

  const self = getSelfPlayer();
  if (self) {
    const direction = getDirectionVector();
    if (direction.x !== 0 || direction.y !== 0) {
      self.x = clamp(self.x + direction.x * MOVE_SPEED * delta, 0, mapSize.width);
      self.y = clamp(self.y + direction.y * MOVE_SPEED * delta, 0, mapSize.height);
      renderPlayer(self.id);

      if (now - lastPositionSend >= POSITION_SEND_INTERVAL_MS) {
        socket.emit("position:update", {
          x: self.x,
          y: self.y
        });
        lastPositionSend = now;
      }
    }
  }

  updatePeerVolumes();
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

window.addEventListener("beforeunload", () => {
  cleanupAllPeers();

  if (localStream) {
    for (const track of localStream.getTracks()) {
      track.stop();
    }
  }
});
