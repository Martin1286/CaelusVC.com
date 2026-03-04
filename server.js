const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAP_WIDTH = 1200;
const MAP_HEIGHT = 800;
const SPAWN_PADDING = 60;
const CONNECT_CODE_LENGTH = 6;
const CONNECT_CODE_TTL_MS = 5 * 60 * 1000;
const ROBLOX_CONNECT_KEY = process.env.ROBLOX_CONNECT_KEY || "";

const users = new Map();
const connectCodes = new Map();
const socketToConnectCode = new Map();

function randomPosition() {
  return {
    x: Math.floor(Math.random() * (MAP_WIDTH - SPAWN_PADDING * 2) + SPAWN_PADDING),
    y: Math.floor(Math.random() * (MAP_HEIGHT - SPAWN_PADDING * 2) + SPAWN_PADDING)
  };
}

function generateConnectCode() {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const random = Math.floor(Math.random() * 10 ** CONNECT_CODE_LENGTH);
    const code = String(random).padStart(CONNECT_CODE_LENGTH, "0");
    if (!connectCodes.has(code)) {
      return code;
    }
  }

  throw new Error("Konnte keinen freien Connect-Code erzeugen");
}

function removeConnectCodeForSocket(socketId) {
  const code = socketToConnectCode.get(socketId);
  if (!code) {
    return;
  }

  socketToConnectCode.delete(socketId);
  connectCodes.delete(code);
}

function pruneExpiredConnectCodes() {
  const now = Date.now();
  for (const [code, entry] of connectCodes) {
    if (entry.expiresAt <= now || !io.sockets.sockets.has(entry.socketId)) {
      connectCodes.delete(code);
      if (socketToConnectCode.get(entry.socketId) === code) {
        socketToConnectCode.delete(entry.socketId);
      }
    }
  }
}

function getOrCreateConnectCode(socketId) {
  const now = Date.now();
  const existingCode = socketToConnectCode.get(socketId);

  if (existingCode) {
    const existingEntry = connectCodes.get(existingCode);
    if (existingEntry && existingEntry.expiresAt > now + 10_000) {
      return existingEntry;
    }
    removeConnectCodeForSocket(socketId);
  }

  const code = generateConnectCode();
  const entry = {
    socketId,
    expiresAt: now + CONNECT_CODE_TTL_MS
  };

  connectCodes.set(code, entry);
  socketToConnectCode.set(socketId, code);

  return entry;
}

app.use(express.json());

app.post("/api/roblox/claim", (req, res) => {
  if (ROBLOX_CONNECT_KEY) {
    const incomingKey = req.get("x-caelus-key") || "";
    if (incomingKey !== ROBLOX_CONNECT_KEY) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
  }

  const rawCode = String(req.body?.code || "");
  const code = rawCode.replace(/\D/g, "").slice(0, CONNECT_CODE_LENGTH);

  if (code.length !== CONNECT_CODE_LENGTH) {
    return res.status(400).json({ ok: false, error: "Code muss 6-stellig sein" });
  }

  const entry = connectCodes.get(code);
  if (!entry) {
    return res.status(404).json({ ok: false, error: "Code nicht gefunden" });
  }

  if (entry.expiresAt <= Date.now()) {
    connectCodes.delete(code);
    if (socketToConnectCode.get(entry.socketId) === code) {
      socketToConnectCode.delete(entry.socketId);
    }
    return res.status(410).json({ ok: false, error: "Code abgelaufen" });
  }

  if (!io.sockets.sockets.has(entry.socketId)) {
    connectCodes.delete(code);
    if (socketToConnectCode.get(entry.socketId) === code) {
      socketToConnectCode.delete(entry.socketId);
    }
    return res.status(410).json({ ok: false, error: "App nicht mehr verbunden" });
  }

  const robloxPayload = {
    code,
    robloxUserId: Number(req.body?.robloxUserId) || 0,
    robloxUsername: String(req.body?.robloxUsername || "Unbekannt").slice(0, 40),
    placeId: Number(req.body?.placeId) || 0,
    jobId: String(req.body?.jobId || "").slice(0, 80),
    claimedAt: Date.now()
  };

  io.to(entry.socketId).emit("link:claimed", robloxPayload);

  connectCodes.delete(code);
  if (socketToConnectCode.get(entry.socketId) === code) {
    socketToConnectCode.delete(entry.socketId);
  }

  return res.json({ ok: true, message: "Verbunden", linkedSocketId: entry.socketId });
});

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  let hasJoined = false;

  socket.on("join", (payload = {}) => {
    if (hasJoined) {
      return;
    }

    hasJoined = true;

    const name = String(payload.name || "Gast").slice(0, 24);
    const position = randomPosition();
    const user = {
      id: socket.id,
      name,
      x: position.x,
      y: position.y
    };

    users.set(socket.id, user);

    const others = [...users.values()].filter((entry) => entry.id !== socket.id);

    socket.emit("joined", {
      self: user,
      users: others,
      map: {
        width: MAP_WIDTH,
        height: MAP_HEIGHT
      }
    });

    socket.broadcast.emit("user:joined", user);
  });

  socket.on("position:update", (payload = {}) => {
    if (!users.has(socket.id)) {
      return;
    }

    const x = Number(payload.x);
    const y = Number(payload.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    const user = users.get(socket.id);
    user.x = Math.max(0, Math.min(MAP_WIDTH, x));
    user.y = Math.max(0, Math.min(MAP_HEIGHT, y));

    io.emit("user:moved", {
      id: user.id,
      x: user.x,
      y: user.y
    });
  });

  socket.on("voice:offer", (payload = {}) => {
    const { to, description } = payload;
    if (typeof to !== "string" || !description) {
      return;
    }

    io.to(to).emit("voice:offer", {
      from: socket.id,
      description
    });
  });

  socket.on("voice:answer", (payload = {}) => {
    const { to, description } = payload;
    if (typeof to !== "string" || !description) {
      return;
    }

    io.to(to).emit("voice:answer", {
      from: socket.id,
      description
    });
  });

  socket.on("voice:ice", (payload = {}) => {
    const { to, candidate } = payload;
    if (typeof to !== "string" || !candidate) {
      return;
    }

    io.to(to).emit("voice:ice", {
      from: socket.id,
      candidate
    });
  });

  socket.on("link:requestCode", () => {
    if (!users.has(socket.id)) {
      socket.emit("link:error", { message: "Bitte zuerst dem Voice Chat beitreten" });
      return;
    }

    const entry = getOrCreateConnectCode(socket.id);
    const code = socketToConnectCode.get(socket.id);
    const expiresInSeconds = Math.max(1, Math.floor((entry.expiresAt - Date.now()) / 1000));

    socket.emit("link:code", {
      code,
      expiresInSeconds
    });
  });

  socket.on("disconnect", () => {
    removeConnectCodeForSocket(socket.id);

    if (!users.has(socket.id)) {
      return;
    }

    users.delete(socket.id);
    io.emit("user:left", { id: socket.id });
  });
});

server.listen(PORT, () => {
  console.log(`Caelus Proximity Voice Chat laeuft auf http://localhost:${PORT}`);
});

setInterval(pruneExpiredConnectCodes, 30_000).unref();
