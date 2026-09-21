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

  socket.on("chat", ({ roomId, text }) => {
    if (socket.data.roomId !== roomId || typeof text !== "string") return;
    const cleanText = text.trim().slice(0, 500);
    if (!cleanText) return;
    io.to(roomId).emit("chat", {
      id: `${Date.now()}-${socket.id}`,
      sender: socket.data.role,
      text: cleanText,
      sentAt: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => {
    const { roomId, role } = socket.data;
    const room = rooms.get(roomId);
    if (!room || room[role] !== socket.id) return;
    room[role] = null;
    socket.to(roomId).emit("peer-left", { role });
    if (!room.host && !room.viewer) rooms.delete(roomId);
    else emitPresence(roomId);
  });
});

server.listen(port, () => {
  console.log(`For U disponível em http://localhost:${port}`);
});
