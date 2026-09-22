import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url";
import path from "node:path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: false } });
const port = Number(process.env.PORT || 3000);
const directory = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(directory, "public")));
app.get("/room/:roomId", (_request, response) => {
  response.sendFile(path.join(directory, "public", "index.html"));
});

const rooms = new Map();

function detectLatinLanguage(text) {
  const normalized = ` ${text.toLowerCase().replace(/[^a-zà-ÿ']/g, " ").replace(/\s+/g, " ")} `;
  const portuguese = [" de ", " que ", " não ", " para ", " você ", " eu ", " uma ", " com ", " como ", " estou ", " meu ", " minha ", " oi ", " tudo ", " bem "];
  const english = [" the ", " you ", " are ", " is ", " to ", " and ", " with ", " how ", " i ", " my ", " hello ", " hi ", " this ", " what ", " good ", " morning ", " night ", " thanks ", " love ", " miss ", " yes ", " no ", " please ", " sorry "];
  const ptScore = portuguese.filter((word) => normalized.includes(word)).length + (/[ãõáéíóúâêôç]/i.test(text) ? 2 : 0);
  const enScore = english.filter((word) => normalized.includes(word)).length;
  return enScore > ptScore ? "en" : "pt";
}

async function translateMessage(text, source, target) {
  if (source === target) return text;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${source}|${target}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Translation failed: ${response.status}`);
  const data = await response.json();
  if (!data?.responseData?.translatedText) throw new Error("Translation returned no text");
  return data.responseData.translatedText
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function roomState(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, { host: null, viewer: null });
  return rooms.get(roomId);
}

function emitPresence(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit("presence", {
    host: Boolean(room.host),
    viewer: Boolean(room.viewer),
  });
}

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, role }, acknowledge) => {
    if (!/^[A-Z0-9]{6}$/.test(roomId) || !["host", "viewer"].includes(role)) {
      acknowledge?.({ ok: false, error: "invalid-room" });
      return;
    }

    const room = roomState(roomId);
    if (room[role] && room[role] !== socket.id) {
      acknowledge?.({ ok: false, error: "role-taken" });
      return;
    }

    room[role] = socket.id;
    socket.data.roomId = roomId;
    socket.data.role = role;
    socket.join(roomId);
    acknowledge?.({ ok: true });
    emitPresence(roomId);
    socket.to(roomId).emit("peer-ready", { role });
  });

  socket.on("signal", ({ roomId, payload }) => {
    if (socket.data.roomId === roomId) socket.to(roomId).emit("signal", payload);
  });

  socket.on("chat", async ({ roomId, text }) => {
    if (socket.data.roomId !== roomId || typeof text !== "string") return;
    const cleanText = text.trim().slice(0, 300);
    if (!cleanText) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const source = socket.data.role === "viewer"
      ? (/\p{Script=Cyrillic}/u.test(cleanText) ? "ru" : detectLatinLanguage(cleanText))
      : detectLatinLanguage(cleanText);
    const target = socket.data.role === "host" ? "ru" : "pt";
    let translatedText = cleanText;
    let translated = false;
    try {
      translatedText = await translateMessage(cleanText, source, target);
      translated = translatedText !== cleanText;
    } catch (error) {
      console.warn("Translation unavailable", error.message);
    }

    const baseMessage = {
      id: `${Date.now()}-${socket.id}`,
      sender: socket.data.role,
      sentAt: new Date().toISOString(),
    };
    socket.emit("chat", { ...baseMessage, text: cleanText, translated: false });
    const recipientId = socket.data.role === "host" ? room.viewer : room.host;
    if (recipientId) io.to(recipientId).emit("chat", { ...baseMessage, text: translatedText, translated });
  });

  socket.on("disconnect", () => {
    const { roomId, role } = socket.data;
    const room = rooms.get(roomId);
    if (!room || room[role] !== socket.id) return;
    if (role === "host") {
      socket.to(roomId).emit("room-closed");
      rooms.delete(roomId);
      return;
    }
    room.viewer = null;
    socket.to(roomId).emit("peer-left", { role });
    emitPresence(roomId);
  });
});

server.listen(port, () => {
  console.log(`For U disponível em http://localhost:${port}`);
});
