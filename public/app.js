const socket = io();

const $ = (selector) => document.querySelector(selector);
const elements = {
  lobby: $("#lobby"), room: $("#room"), create: $("#createRoom"), joinForm: $("#joinForm"),
  roomInput: $("#roomCode"), roomLabel: $("#roomCodeLabel"), copy: $("#copyLink"),
  start: $("#startShare"), stop: $("#stopShare"), local: $("#localPreview"), remote: $("#remoteVideo"),
  remoteAudio: $("#remoteAudio"),
  empty: $("#emptyStage"), media: $("#mediaStatus"), stage: $(".stage-footer"),
  connection: $("#connectionPill"), hostDot: $("#hostDot"), viewerDot: $("#viewerDot"),
  peerStatus: $("#peerStatus"), chatForm: $("#chatForm"), chatInput: $("#chatInput"),
  messages: $("#messages"), language: $("#language"), toast: $("#toast"),
  shareControls: $("#shareControls"), leave: $("#leaveRoom"), roleBadge: $("#roleBadge"),
};

const translations = {
  pt: { offline: "Desconectado", online: "Conectado", privateRoom: "SALA PRIVADA · 2 PESSOAS", together: "Assistir juntos, mesmo de longe.", intro: "Crie uma sala privada, envie o convite e compartilhe uma aba, sua tela ou apenas o áudio.", create: "Criar uma sala", or: "ou", haveCode: "Entrar com código", enter: "Entrar", room: "SALA", you: "Transmissor", friend: "Convidada", invite: "Copiar convite", shareHeading: "O que você quer transmitir?", shareHelp: "Para o Spotify, abra o Web Player em uma aba e compartilhe com áudio.", ready: "Pronto para transmitir", chooseTab: "Escolha um modo acima e inicie quando estiver pronta.", modeScreenAudio: "Tela + áudio", modeScreenOnly: "Só tela", modeAudioOnly: "Só áudio", share: "Iniciar transmissão", waiting: "Aguardando transmissão", stop: "Parar", chat: "Chat", waitingFriend: "Aguardando convidada", friendOnline: "Convidada conectada", secure: "Sala temporária: as mensagens desaparecem quando vocês saem.", messagePlaceholder: "Escreva uma mensagem…", tip: "<strong>Dica:</strong> no Chrome ou Brave, escolha “Aba” e ative “Compartilhar áudio da aba”.", linkCopied: "Convite copiado", joined: "Você entrou na sala", roleTaken: "Esta vaga já está ocupada", invalidCode: "Código inválido", sharing: "Transmitindo agora", receiving: "Recebendo transmissão", audioOnly: "Recebendo áudio", shareEnded: "A transmissão terminou", shareError: "Não foi possível compartilhar", noAudio: "Nenhum áudio foi selecionado", host: "Você", guest: "Convidada" },
  ru: { offline: "Не подключено", online: "Подключено", privateRoom: "ПРИВАТНАЯ КОМНАТА · 2 ЧЕЛОВЕКА", together: "Смотрите вместе, даже на расстоянии.", intro: "Создайте приватную комнату, отправьте приглашение и поделитесь вкладкой, экраном или только звуком.", create: "Создать комнату", or: "или", haveCode: "Войти по коду", enter: "Войти", room: "КОМНАТА", you: "Ведущий", friend: "Гостья", invite: "Копировать приглашение", shareHeading: "Что вы хотите транслировать?", shareHelp: "Для Spotify откройте веб-плеер во вкладке и включите передачу звука.", ready: "Готово к трансляции", chooseTab: "Выберите режим выше и начните трансляцию.", modeScreenAudio: "Экран + звук", modeScreenOnly: "Только экран", modeAudioOnly: "Только звук", share: "Начать трансляцию", waiting: "Ожидание трансляции", stop: "Остановить", chat: "Чат", waitingFriend: "Ожидание гостьи", friendOnline: "Гостья подключена", secure: "Комната временная: сообщения исчезнут после выхода.", messagePlaceholder: "Напишите сообщение…", tip: "<strong>Совет:</strong> в Chrome или Brave выберите вкладку и включите передачу её звука.", linkCopied: "Приглашение скопировано", joined: "Вы вошли в комнату", roleTaken: "Это место уже занято", invalidCode: "Неверный код", sharing: "Идёт трансляция", receiving: "Приём трансляции", audioOnly: "Приём аудио", shareEnded: "Трансляция завершена", shareError: "Не удалось поделиться", noAudio: "Звук не выбран", host: "Вы", guest: "Гостья" },
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
    document.body.dataset.role = role;
    elements.roleBadge.textContent = role === "host" ? "HOST" : "VIEWER";
    if (role === "viewer") {
      elements.shareControls.classList.add("hidden");
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
    const incoming = streams[0];
    const hasVideo = incoming.getVideoTracks().length > 0;
    elements.remote.srcObject = hasVideo ? incoming : null;
    elements.remoteAudio.srcObject = hasVideo ? null : incoming;
    elements.remote.classList.toggle("hidden", !hasVideo);
    elements.remoteAudio.classList.toggle("hidden", hasVideo);
    elements.empty.classList.add("hidden");
    elements.stage.classList.add("live");
    elements.media.querySelector("span").textContent = t(hasVideo ? "receiving" : "audioOnly");
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
    const mode = document.querySelector("input[name='shareMode']:checked")?.value || "screen-audio";
    stream = await getSharingStream(mode);
    const hasVideo = stream.getVideoTracks().length > 0;
    elements.local.srcObject = hasVideo ? stream : null;
    elements.local.style.display = hasVideo ? "block" : "none";
    elements.empty.classList.add("hidden");
    elements.stop.classList.remove("hidden");
    elements.stage.classList.add("live");
    elements.media.querySelector("span").textContent = t("sharing");
    stream.getTracks().forEach((track) => track.addEventListener("ended", stopSharing, { once: true }));
    if (presence.viewer) await makeOffer();
  } catch (error) {
    if (error.name !== "NotAllowedError") console.error(error);
    showToast(t("shareError"));
  }
}

async function getSharingStream(mode) {
  if (mode === "screen-only") {
    return navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false });
  }

  if (mode === "audio-only") {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      displayStream.getVideoTracks().forEach((track) => track.stop());
      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length > 0) return new MediaStream(audioTracks);
      showToast(t("noAudio"));
    } catch (error) {
      if (error.name === "NotAllowedError") throw error;
    }
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }

  return navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
}

function resetMedia(status = t("waiting")) {
  peer?.close(); peer = null;
  elements.remote.srcObject = null;
  elements.remote.classList.add("hidden");
  elements.remoteAudio.srcObject = null;
  elements.remoteAudio.classList.add("hidden");
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
elements.leave.addEventListener("click", () => {
  stream?.getTracks().forEach((track) => track.stop());
  location.href = "/";
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
