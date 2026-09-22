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
const supportedLanguages = new Set(["pt", "ru", "en", "zh"]);

function translationCode(language) {
  return language === "zh" ? "zh-CN" : language;
}

function detectLatinLanguage(text) {
  const normalized = ` ${text.toLowerCase().replace(/[^a-zà-ÿ']/g, " ").replace(/\s+/g, " ")} `;
  const portuguese = [" de ", " que ", " não ", " para ", " você ", " eu ", " uma ", " com ", " como ", " estou ", " meu ", " minha ", " oi ", " tudo ", " bem "];
  const english = [" the ", " you ", " are ", " is ", " to ", " and ", " with ", " how ", " i ", " my ", " hello ", " hi ", " this ", " what ", " good ", " morning ", " night ", " thanks ", " love ", " miss ", " yes ", " no ", " please ", " sorry "];
  const ptScore = portuguese.filter((word) => normalized.includes(word)).length + (/[ãõáéíóúâêôç]/i.test(text) ? 2 : 0);
  const enScore = english.filter((word) => normalized.includes(word)).length;
  return enScore > ptScore ? "en" : "pt";
}

function detectLanguage(text) {
  if (/\p{Script=Cyrillic}/u.test(text)) return "ru";
  if (/\p{Script=Han}/u.test(text)) return "zh-CN";
  return detectLatinLanguage(text);
}

function cleanTranslation(text) {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function assertTranslated(original, translated) {
  const clean = cleanTranslation(translated || "").trim();
  if (!clean || clean.localeCompare(original.trim(), undefined, { sensitivity: "accent" }) === 0) {
    throw new Error("Provider returned the original text");
  }
  return clean;
}

async function translateWithMyMemory(text, source, target) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${source}|${target}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Translation failed: ${response.status}`);
  const data = await response.json();
  if (Number(data?.responseStatus) >= 400) throw new Error(data?.responseDetails || "MyMemory rejected the request");
  return assertTranslated(text, data?.responseData?.translatedText);
}

async function translateWithLibreTranslate(endpoint, text, source, target) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: source.split("-")[0],
      target: target.split("-")[0],
      format: "text",
    }),
    signal: AbortSignal.timeout(7000),
  });
  if (!response.ok) throw new Error(`LibreTranslate failed: ${response.status}`);
  const data = await response.json();
  return assertTranslated(text, data?.translatedText);
}

async function translateMessage(text, source, target) {
  if (source === target) return text;
  try {
    return await translateWithMyMemory(text, source, target);
  } catch (primaryError) {
    console.warn("MyMemory unavailable", primaryError.message);
  }

  return Promise.any([
    translateWithLibreTranslate("https://translate.flossboxin.org.in/translate", text, source, target),
    translateWithLibreTranslate("https://lt.blitzw.in/translate", text, source, target),
  ]);
}

function roomState(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, {
    host: null,
    viewer: null,
    languages: { host: "pt", viewer: "ru" },
  });
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
  socket.on("join-room", ({ roomId, role, language }, acknowledge) => {
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
    room.languages[role] = supportedLanguages.has(language) ? language : (role === "host" ? "pt" : "ru");
    socket.data.roomId = roomId;
    socket.data.role = role;
    socket.data.language = room.languages[role];
    socket.join(roomId);
    acknowledge?.({ ok: true });
    emitPresence(roomId);
    socket.to(roomId).emit("peer-ready", { role });
  });

  socket.on("update-language", ({ roomId, language }) => {
    const { role } = socket.data;
    const room = rooms.get(roomId);
    if (!room || room[role] !== socket.id || !supportedLanguages.has(language)) return;
    room.languages[role] = language;
    socket.data.language = language;
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

    const source = detectLanguage(cleanText);
    const recipientRole = socket.data.role === "host" ? "viewer" : "host";
    const target = translationCode(room.languages[recipientRole]);
    let translatedText = cleanText;
    let translated = false;
    let translationFailed = false;
    try {
      translatedText = await translateMessage(cleanText, source, target);
      translated = translatedText !== cleanText;
    } catch (error) {
      translationFailed = source !== target;
      console.warn("Translation unavailable", error.message || "All providers failed");
    }

    const baseMessage = {
      id: `${Date.now()}-${socket.id}`,
      sender: socket.data.role,
      sentAt: new Date().toISOString(),
    };
    socket.emit("chat", { ...baseMessage, text: cleanText, translated: false });
    const recipientId = room[recipientRole];
    if (recipientId) io.to(recipientId).emit("chat", {
      ...baseMessage,
      text: translatedText,
      translated,
      translationFailed,
    });
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
  console.log(`With U disponível em http://localhost:${port}`);
});
