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

app.get("/api/turn-credentials", async (_request, response) => {
  const credentialsUrl = process.env.METERED_TURN_API_URL;
  if (!credentialsUrl) {
    response.status(503).json({ error: "TURN is not configured" });
    return;
  }

  try {
    const turnResponse = await fetch(credentialsUrl, { signal: AbortSignal.timeout(7000) });
    if (!turnResponse.ok) throw new Error(`TURN provider returned ${turnResponse.status}`);
    const iceServers = await turnResponse.json();
    if (!Array.isArray(iceServers) || iceServers.length === 0) throw new Error("Invalid TURN response");
    response.set("cache-control", "no-store").json(iceServers);
  } catch (error) {
    console.warn("TURN credentials unavailable", error.message);
    response.status(502).json({ error: "TURN credentials unavailable" });
  }
});

app.get("/room/:roomId", (_request, response) => {
  response.sendFile(path.join(directory, "public", "index.html"));
});

const rooms = new Map();
const supportedLanguages = new Set(["pt", "ru", "en", "zh"]);
const MAX_PARTICIPANTS = 8;

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

async function translateWithGoogle(text, target) {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "auto");
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);
  const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error(`Google Translate failed: ${response.status}`);
  const data = await response.json();
  const translated = Array.isArray(data?.[0])
    ? data[0].map((part) => part?.[0] || "").join("")
    : "";
  const clean = cleanTranslation(translated).trim();
  if (!clean) throw new Error("Google Translate returned an empty response");
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
    return await translateWithGoogle(text, target);
  } catch (googleError) {
    console.warn("Google Translate unavailable", googleError.message);
  }

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

function sanitizeName(name) {
  if (typeof name !== "string") return "Convidado";
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 24);
  return clean || "Convidado";
}

function roomState(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      ownerId: null,
      activeSharerId: null,
      participants: new Map(),
    });
  }
  return rooms.get(roomId);
}

function publicRoomState(room) {
  return {
    ownerId: room.ownerId,
    activeSharerId: room.activeSharerId,
    participants: [...room.participants.values()].map(({ id, name, language, joinedAt }) => ({
      id,
      name,
      language,
      joinedAt,
    })),
  };
}

function emitRoomState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit("room-state", publicRoomState(room));
}

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, language, name }, acknowledge) => {
    if (!/^[A-Z0-9]{6}$/.test(roomId)) {
      acknowledge?.({ ok: false, error: "invalid-room" });
      return;
    }

    const room = roomState(roomId);
    if (room.participants.size >= MAX_PARTICIPANTS) {
      acknowledge?.({ ok: false, error: "room-full" });
      return;
    }

    const participant = {
      id: socket.id,
      name: sanitizeName(name),
      language: supportedLanguages.has(language) ? language : "pt",
      joinedAt: Date.now(),
    };

    room.participants.set(socket.id, participant);
    if (!room.ownerId) room.ownerId = socket.id;

    socket.data.roomId = roomId;
    socket.data.language = participant.language;
    socket.join(roomId);

    acknowledge?.({
      ok: true,
      participantId: socket.id,
      state: publicRoomState(room),
      maxParticipants: MAX_PARTICIPANTS,
    });

    socket.to(roomId).emit("participant-joined", participant);
    emitRoomState(roomId);
  });

  socket.on("update-profile", ({ roomId, language, name }) => {
    if (socket.data.roomId !== roomId) return;
    const room = rooms.get(roomId);
    const participant = room?.participants.get(socket.id);
    if (!participant) return;

    if (supportedLanguages.has(language)) {
      participant.language = language;
      socket.data.language = language;
    }
    if (typeof name === "string") participant.name = sanitizeName(name);
    emitRoomState(roomId);
  });

  socket.on("begin-share", ({ roomId }, acknowledge) => {
    if (socket.data.roomId !== roomId) return acknowledge?.({ ok: false, error: "invalid-room" });
    const room = rooms.get(roomId);
    if (!room?.participants.has(socket.id)) return acknowledge?.({ ok: false, error: "invalid-room" });

    if (room.activeSharerId && room.activeSharerId !== socket.id) {
      const active = room.participants.get(room.activeSharerId);
      acknowledge?.({ ok: false, error: "share-busy", activeSharerName: active?.name || "alguém" });
      return;
    }

    room.activeSharerId = socket.id;
    acknowledge?.({ ok: true });
    io.to(roomId).emit("share-owner", { sharerId: socket.id });
    emitRoomState(roomId);
  });

  socket.on("stop-share", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || socket.data.roomId !== roomId || room.activeSharerId !== socket.id) return;
    room.activeSharerId = null;
    io.to(roomId).emit("share-stopped", { sharerId: socket.id });
    emitRoomState(roomId);
  });

  socket.on("signal", ({ roomId, targetId, payload }) => {
    const room = rooms.get(roomId);
    if (
      socket.data.roomId !== roomId ||
      !room?.participants.has(socket.id) ||
      !room.participants.has(targetId)
    ) return;

    io.to(targetId).emit("signal", {
      fromId: socket.id,
      payload,
    });
  });

  socket.on("chat", async ({ roomId, text }) => {
    if (socket.data.roomId !== roomId || typeof text !== "string") return;
    const cleanText = text.trim().slice(0, 300);
    if (!cleanText) return;

    const room = rooms.get(roomId);
    const sender = room?.participants.get(socket.id);
    if (!room || !sender) return;

    const source = detectLanguage(cleanText);
    const baseMessage = {
      id: `${Date.now()}-${socket.id}`,
      senderId: socket.id,
      senderName: sender.name,
      sentAt: new Date().toISOString(),
    };

    socket.emit("chat", { ...baseMessage, text: cleanText, translated: false });

    const translatedByTarget = new Map();
    await Promise.all([...room.participants.values()]
      .filter((participant) => participant.id !== socket.id)
      .map(async (recipient) => {
        const target = translationCode(recipient.language);
        let translatedText = cleanText;
        let translated = false;
        let translationFailed = false;

        if (source !== target) {
          try {
            if (!translatedByTarget.has(target)) {
              translatedByTarget.set(target, translateMessage(cleanText, source, target));
            }
            translatedText = await translatedByTarget.get(target);
            translated = translatedText !== cleanText;
          } catch (error) {
            translationFailed = true;
            console.warn("Translation unavailable", error.message || "All providers failed");
          }
        }

        io.to(recipient.id).emit("chat", {
          ...baseMessage,
          text: translatedText,
          translated,
          translationFailed,
        });
      }));
  });

  socket.on("disconnect", () => {
    const { roomId } = socket.data;
    const room = rooms.get(roomId);
    if (!room?.participants.has(socket.id)) return;

    room.participants.delete(socket.id);
    socket.to(roomId).emit("participant-left", { participantId: socket.id });

    if (room.activeSharerId === socket.id) {
      room.activeSharerId = null;
      socket.to(roomId).emit("share-stopped", { sharerId: socket.id });
    }

    if (room.participants.size === 0) {
      rooms.delete(roomId);
      return;
    }

    if (room.ownerId === socket.id) {
      room.ownerId = room.participants.keys().next().value;
    }

    emitRoomState(roomId);
  });
});

server.listen(port, () => {
  console.log(`With U disponível em http://localhost:${port}`);
});
