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
  resume: $("#resumePlayback"),
};

const translations = {
  pt: { offline: "Desconectado", online: "Conectado", privateRoom: "SALA PRIVADA · 2 PESSOAS", together: "Assistir juntos, mesmo de longe.", intro: "Crie uma sala privada, envie o convite e compartilhe uma aba, sua tela ou apenas o áudio.", create: "Criar uma sala", or: "ou", haveCode: "Entrar com código", enter: "Entrar", room: "SALA", you: "Transmissor", friend: "Convidada", invite: "Copiar convite", shareHeading: "O que você quer transmitir?", shareHelp: "Para o Spotify, abra o Web Player em uma aba e compartilhe com áudio.", ready: "Pronto para transmitir", chooseTab: "Escolha um modo acima e inicie quando estiver pronta.", modeScreenAudio: "Tela + áudio", modeScreenOnly: "Só tela", modeAudioOnly: "Só áudio", share: "Iniciar transmissão", waiting: "Aguardando transmissão", stop: "Parar", chat: "Chat", waitingFriend: "Aguardando convidada", friendOnline: "Convidada conectada", secure: "Tradução automática ativada: as mensagens chegam no idioma selecionado acima.", messagePlaceholder: "Escreva uma mensagem…", tip: "<strong>Dica:</strong> no Chrome ou Brave, escolha “Aba” e ative “Compartilhar áudio da aba”.", linkCopied: "Convite copiado", joined: "Você entrou na sala", roleTaken: "Esta vaga já está ocupada", invalidCode: "Código inválido", sharing: "Transmitindo agora", receiving: "Recebendo transmissão", audioOnly: "Recebendo áudio", shareEnded: "A transmissão terminou", shareError: "Não foi possível compartilhar", noAudio: "Nenhum áudio foi selecionado", roomClosed: "A sala foi encerrada pelo transmissor", translated: "Traduzido", translationFailed: "Tradução indisponível", playStream: "Reproduzir transmissão", host: "Você", guest: "Convidada" },
  ru: { offline: "Не подключено", online: "Подключено", privateRoom: "ПРИВАТНАЯ КОМНАТА · 2 ЧЕЛОВЕКА", together: "Смотрите вместе, даже на расстоянии.", intro: "Создайте приватную комнату, отправьте приглашение и поделитесь вкладкой, экраном или только звуком.", create: "Создать комнату", or: "или", haveCode: "Войти по коду", enter: "Войти", room: "КОМНАТА", you: "Ведущий", friend: "Гостья", invite: "Копировать приглашение", shareHeading: "Что вы хотите транслировать?", shareHelp: "Для Spotify откройте веб-плеер во вкладке и включите передачу звука.", ready: "Готово к трансляции", chooseTab: "Выберите режим выше и начните трансляцию.", modeScreenAudio: "Экран + звук", modeScreenOnly: "Только экран", modeAudioOnly: "Только звук", share: "Начать трансляцию", waiting: "Ожидание трансляции", stop: "Остановить", chat: "Чат", waitingFriend: "Ожидание гостьи", friendOnline: "Гостья подключена", secure: "Автоперевод включён: вы получаете сообщения на русском языке.", messagePlaceholder: "Напишите по-русски…", tip: "<strong>Совет:</strong> в Chrome или Brave выберите вкладку и включите передачу её звука.", linkCopied: "Приглашение скопировано", joined: "Вы вошли в комнату", roleTaken: "Это место уже занято", invalidCode: "Неверный код", sharing: "Идёт трансляция", waiting: "Ожидание трансляции", stop: "Остановить", receiving: "Приём трансляции", audioOnly: "Приём аудио", shareEnded: "Трансляция завершена", shareError: "Не удалось поделиться", noAudio: "Звук не выбран", roomClosed: "Ведущий закрыл комнату", translated: "Переведено", translationFailed: "Перевод недоступен", playStream: "Включить трансляцию", host: "Вы", guest: "Гостья" },
  en: { offline: "Offline", online: "Connected", privateRoom: "PRIVATE ROOM · 2 PEOPLE", together: "Watch together, even from far away.", intro: "Create a private room, send the invite, and share a tab, your screen, or audio only.", create: "Create a room", or: "or", haveCode: "Join with a code", enter: "Join", room: "ROOM", you: "Host", friend: "Guest", invite: "Copy invite", shareHeading: "What do you want to share?", shareHelp: "For Spotify, open the Web Player in a browser tab and share it with audio.", ready: "Ready to stream", chooseTab: "Choose a mode above and start when you are ready.", modeScreenAudio: "Screen + audio", modeScreenOnly: "Screen only", modeAudioOnly: "Audio only", share: "Start streaming", waiting: "Waiting for stream", stop: "Stop", chat: "Chat", waitingFriend: "Waiting for guest", friendOnline: "Guest connected", secure: "Automatic translation is on: messages arrive in your selected language.", messagePlaceholder: "Write a message…", tip: "<strong>Tip:</strong> in Chrome or Brave, choose “Tab” and enable “Share tab audio”.", linkCopied: "Invite copied", joined: "You joined the room", roleTaken: "This spot is already taken", invalidCode: "Invalid code", sharing: "Streaming now", receiving: "Receiving stream", audioOnly: "Receiving audio", shareEnded: "The stream has ended", shareError: "Could not start sharing", noAudio: "No audio was selected", roomClosed: "The host closed the room", translated: "Translated", translationFailed: "Translation unavailable", playStream: "Play stream", host: "You", guest: "Guest" },
  zh: { offline: "未连接", online: "已连接", privateRoom: "私人房间 · 2 人", together: "即使相隔很远，也能一起观看。", intro: "创建私人房间，发送邀请，并共享标签页、屏幕或仅共享音频。", create: "创建房间", or: "或", haveCode: "使用房间代码加入", enter: "加入", room: "房间", you: "主持人", friend: "访客", invite: "复制邀请", shareHeading: "您想共享什么？", shareHelp: "使用 Spotify 时，请在浏览器标签页打开网页版播放器并共享音频。", ready: "准备开始直播", chooseTab: "请在上方选择模式，然后开始直播。", modeScreenAudio: "屏幕和音频", modeScreenOnly: "仅屏幕", modeAudioOnly: "仅音频", share: "开始直播", waiting: "等待直播", stop: "停止", chat: "聊天", waitingFriend: "等待访客", friendOnline: "访客已连接", secure: "自动翻译已开启：消息将以您选择的语言显示。", messagePlaceholder: "输入消息…", tip: "<strong>提示：</strong>在 Chrome 或 Brave 中选择“标签页”，并启用“共享标签页音频”。", linkCopied: "邀请已复制", joined: "您已加入房间", roleTaken: "该位置已被占用", invalidCode: "房间代码无效", sharing: "正在直播", receiving: "正在接收直播", audioOnly: "正在接收音频", shareEnded: "直播已结束", shareError: "无法开始共享", noAudio: "未选择音频", roomClosed: "主持人已关闭房间", translated: "已翻译", translationFailed: "翻译暂不可用", playStream: "播放直播", host: "您", guest: "访客" },
};

const browserLanguage = navigator.language.toLowerCase();
let language = browserLanguage.startsWith("ru") ? "ru"
  : browserLanguage.startsWith("zh") ? "zh"
    : browserLanguage.startsWith("en") ? "en"
      : "pt";
let roomId = null;
let role = null;
let peer = null;
let stream = null;
let presence = { host: false, viewer: false };

const t = (key) => translations[language][key] || key;
function applyLanguage() {
  document.documentElement.lang = { pt: "pt-BR", ru: "ru", en: "en", zh: "zh-CN" }[language];
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
  socket.emit("join-room", { roomId: id, role: selectedRole, language }, (result) => {
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
  peer.ontrack = async ({ streams }) => {
    const incoming = streams[0];
    const hasVideo = incoming.getVideoTracks().length > 0;
    elements.remote.srcObject = hasVideo ? incoming : null;
    elements.remoteAudio.srcObject = hasVideo ? null : incoming;
    elements.remote.classList.toggle("hidden", !hasVideo);
    elements.remoteAudio.classList.toggle("hidden", hasVideo);
    elements.empty.classList.add("hidden");
    elements.stage.classList.add("live");
    elements.media.querySelector("span").textContent = t(hasVideo ? "receiving" : "audioOnly");
    const player = hasVideo ? elements.remote : elements.remoteAudio;
    elements.resume.classList.add("hidden");
    try {
      await player.play();
    } catch {
      elements.resume.classList.remove("hidden");
    }
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
    elements.local.classList.toggle("main-preview", hasVideo);
    elements.empty.classList.toggle("hidden", hasVideo);
    if (!hasVideo) {
      $("#stageTitle").textContent = t("sharing");
      $("#stageDescription").textContent = t("modeAudioOnly");
    }
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
  elements.resume.classList.add("hidden");
  elements.local.style.display = "none";
  elements.local.classList.remove("main-preview");
  elements.empty.classList.remove("hidden");
  $("#stageTitle").textContent = t(role === "host" ? "ready" : "waiting");
  $("#stageDescription").textContent = t(role === "host" ? "chooseTab" : "waitingFriend");
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
elements.resume.addEventListener("click", async () => {
  const player = elements.remote.classList.contains("hidden") ? elements.remoteAudio : elements.remote;
  try {
    await player.play();
    elements.resume.classList.add("hidden");
  } catch {
    showToast(t("shareError"));
  }
});
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
elements.language.addEventListener("change", () => {
  language = elements.language.value;
  applyLanguage();
  if (roomId) socket.emit("update-language", { roomId, language });
});

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
socket.on("room-closed", () => {
  resetMedia(t("shareEnded"));
  showToast(t("roomClosed"));
  setTimeout(() => { location.href = "/"; }, 1800);
});
socket.on("signal", handleSignal);
socket.on("chat", (message) => {
  const mine = message.sender === role;
  const item = document.createElement("div");
  item.className = `message${mine ? " mine" : ""}`;
  const label = document.createElement("span");
  const translationStatus = message.translated
    ? ` · ${t("translated")}`
    : message.translationFailed ? ` · ${t("translationFailed")}` : "";
  label.textContent = `${mine ? t("host") : t("guest")}${translationStatus}`;
  const body = document.createElement("p");
  body.textContent = message.text;
  item.append(label, body);
  elements.messages.append(item);
  elements.messages.scrollTop = elements.messages.scrollHeight;
});

applyLanguage();
const linkedRoom = roomFromPath();
if (linkedRoom) enterRoom(linkedRoom, "viewer");
