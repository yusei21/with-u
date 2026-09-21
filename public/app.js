const socket = io();

const $ = (selector) => document.querySelector(selector);
const elements = {
  lobby: $("#lobby"), room: $("#room"), create: $("#createRoom"), joinForm: $("#joinForm"),
  roomInput: $("#roomCode"), roomLabel: $("#roomCodeLabel"), copy: $("#copyLink"),
  start: $("#startShare"), stop: $("#stopShare"), local: $("#localPreview"), remote: $("#remoteVideo"),
  empty: $("#emptyStage"), media: $("#mediaStatus"), stage: $(".stage-footer"),
  connection: $("#connectionPill"), hostDot: $("#hostDot"), viewerDot: $("#viewerDot"),
  peerStatus: $("#peerStatus"), chatForm: $("#chatForm"), chatInput: $("#chatInput"),
  messages: $("#messages"), language: $("#language"), toast: $("#toast"),
};

const translations = {
  pt: { offline: "Desconectado", online: "Conectado", privateRoom: "SALA PRIVADA · 2 PESSOAS", together: "A distância fica menor quando vocês assistem juntos.", intro: "Compartilhe uma aba, sua tela ou um arquivo reproduzido no computador. O áudio e o vídeo vão direto para a outra pessoa.", create: "Criar uma sala", or: "ou", haveCode: "Já tem um código?", enter: "Entrar", room: "SALA", you: "Você", friend: "Amiga", ready: "Pronto para transmitir", chooseTab: "Escolha uma aba com áudio para ter o melhor resultado.", share: "Compartilhar aba ou tela", waiting: "Aguardando transmissão", stop: "Parar", chat: "Chat", waitingFriend: "Aguardando amiga", friendOnline: "Amiga conectada", secure: "A sala é temporária. As mensagens desaparecem quando vocês saem.", messagePlaceholder: "Escreva uma mensagem…", tip: "<strong>Dica:</strong> no Chrome, escolha “Aba” e marque “Compartilhar áudio da aba”.", linkCopied: "Link copiado", joined: "Você entrou na sala", roleTaken: "Esta vaga já está ocupada", invalidCode: "Código inválido", sharing: "Transmitindo agora", receiving: "Recebendo transmissão", shareEnded: "A transmissão terminou", shareError: "Não foi possível compartilhar", host: "Você", guest: "Amiga" },
  ru: { offline: "Не подключено", online: "Подключено", privateRoom: "ПРИВАТНАЯ КОМНАТА · 2 ЧЕЛОВЕКА", together: "Расстояние меньше, когда вы смотрите вместе.", intro: "Поделитесь вкладкой, экраном или файлом на компьютере. Аудио и видео передаются напрямую другому человеку.", create: "Создать комнату", or: "или", haveCode: "Уже есть код?", enter: "Войти", room: "КОМНАТА", you: "Вы", friend: "Подруга", ready: "Готово к трансляции", chooseTab: "Для лучшего результата выберите вкладку со звуком.", share: "Поделиться экраном", waiting: "Ожидание трансляции", stop: "Остановить", chat: "Чат", waitingFriend: "Ожидание подруги", friendOnline: "Подруга подключена", secure: "Комната временная. Сообщения исчезнут, когда вы выйдете.", messagePlaceholder: "Напишите сообщение…", tip: "<strong>Совет:</strong> в Chrome выберите «Вкладка» и включите передачу звука.", linkCopied: "Ссылка скопирована", joined: "Вы вошли в комнату", roleTaken: "Это место уже занято", invalidCode: "Неверный код", sharing: "Идёт трансляция", receiving: "Приём трансляции", shareEnded: "Трансляция завершена", shareError: "Не удалось поделиться", host: "Вы", guest: "Подруга" },
};

let language = navigator.language.toLowerCase().startsWith("ru") ? "ru" : "pt";
let roomId = null;
let role = null;
let peer = null;
let stream = null;
let presence = { host: false, viewer: false };

const t = (key) => translations[language][key] || key;
function applyLanguage() {
  document.documentElement.lang = language === "ru" ? "ru" : "pt-BR";
  elements.language.value = language;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = t(node.dataset.i18n);
    if (value.includes("<strong>")) node.innerHTML = value;
    else node.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => node.placeholder = t(node.dataset.i18nPlaceholder));
  updatePresence(presence);
}

function showToast(text) {
  elements.toast.textContent = text;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function randomRoom() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function roomFromPath() {
  const match = location.pathname.match(/^\/room\/([A-Za-z0-9]{6})$/);
  return match?.[1].toUpperCase() || null;
}

function enterRoom(id, selectedRole) {
  socket.emit("join-room", { roomId: id, role: selectedRole }, (result) => {
    if (!result?.ok) {
      showToast(t(result?.error === "role-taken" ? "roleTaken" : "invalidCode"));
      return;
    }
    roomId = id;
    role = selectedRole;
    history.replaceState({}, "", `/room/${roomId}`);
    elements.roomLabel.textContent = roomId;
    elements.lobby.classList.add("hidden");
    elements.room.classList.remove("hidden");
    if (role === "viewer") {
      elements.start.classList.add("hidden");
      $("#stageTitle").textContent = t("waiting");
      $("#stageDescription").textContent = t("waitingFriend");
    }
    showToast(t("joined"));
  });
}

function updatePresence(state) {
  presence = state;
  elements.hostDot.classList.toggle("active", state.host);
  elements.viewerDot.classList.toggle("active", state.viewer);
  elements.peerStatus.textContent = state.viewer ? t("friendOnline") : t("waitingFriend");
}

function createPeer() {
  peer?.close();
  peer = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  });
  peer.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit("signal", { roomId, payload: { type: "candidate", candidate } });
  };
  peer.onconnectionstatechange = () => {
    const connected = ["connected", "completed"].includes(peer.connectionState);
    elements.connection.classList.toggle("connected", connected || socket.connected);
  };
  peer.ontrack = ({ streams }) => {
    elements.remote.srcObject = streams[0];
    elements.remote.classList.remove("hidden");
    elements.empty.classList.add("hidden");
    elements.stage.classList.add("live");
    elements.media.querySelector("span").textContent = t("receiving");
  };
  return peer;
}

async function makeOffer() {
  if (!stream || role !== "host") return;
  const connection = createPeer();
  stream.getTracks().forEach((track) => connection.addTrack(track, stream));
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  socket.emit("signal", { roomId, payload: { type: "offer", description: offer } });
}

async function handleSignal(payload) {
  try {
    if (payload.type === "offer" && role === "viewer") {
      const connection = createPeer();
      await connection.setRemoteDescription(payload.description);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      socket.emit("signal", { roomId, payload: { type: "answer", description: answer } });
    } else if (payload.type === "answer" && peer) {
      await peer.setRemoteDescription(payload.description);
    } else if (payload.type === "candidate" && peer) {
      await peer.addIceCandidate(payload.candidate);
    } else if (payload.type === "stopped") {
      resetMedia(t("shareEnded"));
    }
  } catch (error) {
    console.error("WebRTC signal error", error);
  }
}

async function startSharing() {
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
    elements.local.srcObject = stream;
    elements.local.style.display = "block";
    elements.empty.classList.add("hidden");
    elements.stop.classList.remove("hidden");
    elements.stage.classList.add("live");
    elements.media.querySelector("span").textContent = t("sharing");
    stream.getVideoTracks()[0].addEventListener("ended", stopSharing);
    if (presence.viewer) await makeOffer();
  } catch (error) {
    if (error.name !== "NotAllowedError") console.error(error);
    showToast(t("shareError"));
  }
}

function resetMedia(status = t("waiting")) {
  peer?.close(); peer = null;
  elements.remote.srcObject = null;
  elements.remote.classList.add("hidden");
  elements.local.style.display = "none";
  elements.empty.classList.remove("hidden");
  elements.stop.classList.add("hidden");
  elements.stage.classList.remove("live");
  elements.media.querySelector("span").textContent = status;
}

function stopSharing() {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
  stream = null;
  socket.emit("signal", { roomId, payload: { type: "stopped" } });
  resetMedia();
}

elements.create.addEventListener("click", () => enterRoom(randomRoom(), "host"));
elements.joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = elements.roomInput.value.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return showToast(t("invalidCode"));
  enterRoom(code, "viewer");
});
elements.roomInput.addEventListener("input", () => elements.roomInput.value = elements.roomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
elements.start.addEventListener("click", startSharing);
elements.stop.addEventListener("click", stopSharing);
elements.copy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(location.href);
  showToast(t("linkCopied"));
});
elements.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.chatInput.value.trim();
  if (!text) return;
  socket.emit("chat", { roomId, text });
  elements.chatInput.value = "";
});
elements.language.addEventListener("change", () => { language = elements.language.value; applyLanguage(); });

socket.on("connect", () => {
  elements.connection.classList.add("connected");
  elements.connection.querySelector("span").textContent = t("online");
});
socket.on("disconnect", () => {
  elements.connection.classList.remove("connected");
  elements.connection.querySelector("span").textContent = t("offline");
});
socket.on("presence", (state) => updatePresence(state));
socket.on("peer-ready", async ({ role: joinedRole }) => {
  if (joinedRole === "viewer" && stream) await makeOffer();
});
socket.on("peer-left", () => { peer?.close(); peer = null; });
socket.on("signal", handleSignal);
socket.on("chat", (message) => {
  const mine = message.sender === role;
  const item = document.createElement("div");
  item.className = `message${mine ? " mine" : ""}`;
  const label = document.createElement("span");
  label.textContent = mine ? t("host") : t("guest");
  const body = document.createElement("p");
  body.textContent = message.text;
  item.append(label, body);
  elements.messages.append(item);
  elements.messages.scrollTop = elements.messages.scrollHeight;
});

applyLanguage();
const linkedRoom = roomFromPath();
if (linkedRoom) enterRoom(linkedRoom, "viewer");
