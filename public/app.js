const socket = io();

const $ = (selector) => document.querySelector(selector);
const elements = {
  lobby: $("#lobby"),
  room: $("#room"),
  create: $("#createRoom"),
  joinForm: $("#joinForm"),
  roomInput: $("#roomCode"),
  roomLabel: $("#roomCodeLabel"),
  copy: $("#copyLink"),
  copySecondary: $("#copyLinkSecondary"),
  mobileInvite: $("#mobileInvite"),
  mobileShare: $("#mobileShare"),
  mobileChat: $("#mobileChat"),
  start: $("#startShare"),
  stop: $("#stopShare"),
  local: $("#localPreview"),
  remote: $("#remoteVideo"),
  remoteAudio: $("#remoteAudio"),
  empty: $("#emptyStage"),
  media: $("#mediaStatus"),
  stage: $(".stage"),
  connection: $("#connectionPill"),
  peerStatus: $("#peerStatus"),
  chatForm: $("#chatForm"),
  chatInput: $("#chatInput"),
  messages: $("#messages"),
  language: $("#language"),
  toast: $("#toast"),
  leave: $("#leaveRoom"),
  resume: $("#resumePlayback"),
  participantStack: $("#participantStack"),
  participantCount: $("#participantCount"),
  peopleList: $("#peopleList"),
  liveBadge: $("#liveBadge"),
  sharerName: $("#sharerName"),
  shareHelp: $("#shareHelp"),
  nameDialog: $("#nameDialog"),
  nameForm: $("#nameForm"),
  displayName: $("#displayName"),
};

const translations = {
  pt: {
    offline: "Offline", online: "Conectado", watchParty: "WATCH PARTY PRIVADA",
    together: "Assista junto. Onde quer que todo mundo esteja.",
    intro: "Crie uma sala, convide várias pessoas e compartilhe uma aba, a tela inteira ou só o áudio. Qualquer pessoa da sala pode transmitir.",
    create: "Criar uma sala", enter: "Entrar", capacity: "Até 8 pessoas por sala · sem conta · chat com tradução automática",
    everyoneShares: "Todo mundo pode transmitir", everyoneSharesHelp: "Troquem quem está compartilhando sem recriar a sala.",
    groupRoom: "Feito para grupos", groupRoomHelp: "Veja quem entrou e convide o grupo com um único link.",
    translation: "Chat traduzido", translationHelp: "Cada pessoa recebe as mensagens no idioma escolhido.",
    room: "SALA", leave: "Sair", ready: "Pronto para assistir juntos",
    chooseTab: "Quando alguém compartilhar uma aba, tela ou áudio, a transmissão aparece aqui.",
    live: "AO VIVO", playStream: "Reproduzir", waiting: "Aguardando transmissão", stop: "Parar transmissão",
    shareHeading: "Compartilhar com a sala", shareHelp: "Qualquer pessoa pode assumir a transmissão quando estiver livre.",
    modeScreenAudio: "Tela + áudio", modeScreenOnly: "Tela", modeAudioOnly: "Áudio", share: "Transmitir",
    watchingNow: "ASSISTINDO AGORA", people: "Pessoas", invite: "Convidar", roomChat: "SALA", chat: "Chat",
    secure: "As mensagens são temporárias e podem ser traduzidas automaticamente para cada pessoa.",
    messagePlaceholder: "Escreva uma mensagem…", yourName: "Como devemos chamar você?",
    yourNameHelp: "Esse nome aparece para as outras pessoas da sala.", namePlaceholder: "Seu nome", continue: "Continuar",
    linkCopied: "Convite copiado", joined: "Você entrou na sala", invalidCode: "Código inválido",
    roomFull: "Esta sala já está cheia", sharing: "Você está transmitindo", receiving: "Recebendo transmissão",
    audioOnly: "Recebendo áudio", shareEnded: "A transmissão terminou", shareError: "Não foi possível iniciar a transmissão",
    noAudio: "Nenhum áudio foi selecionado", shareBusy: "já está transmitindo", translated: "Traduzido",
    translationFailed: "Tradução indisponível", you: "Você", owner: "Criador da sala", viewer: "Na sala",
    sharingNow: "Transmitindo agora", onlinePeople: "online", someone: "Alguém"
  },
  en: {
    offline: "Offline", online: "Connected", watchParty: "PRIVATE WATCH PARTY",
    together: "Watch together. Wherever everyone is.",
    intro: "Create a room, invite your group, and share a tab, your whole screen, or audio only. Anyone in the room can stream.",
    create: "Create a room", enter: "Join", capacity: "Up to 8 people · no account · chat with automatic translation",
    everyoneShares: "Everyone can stream", everyoneSharesHelp: "Switch who is sharing without creating a new room.",
    groupRoom: "Built for groups", groupRoomHelp: "See who joined and invite everyone with one link.",
    translation: "Translated chat", translationHelp: "Each person receives messages in their selected language.",
    room: "ROOM", leave: "Leave", ready: "Ready to watch together",
    chooseTab: "When someone shares a tab, screen, or audio, the stream appears here.",
    live: "LIVE", playStream: "Play", waiting: "Waiting for a stream", stop: "Stop stream",
    shareHeading: "Share with the room", shareHelp: "Anyone can take over the stream while it is available.",
    modeScreenAudio: "Screen + audio", modeScreenOnly: "Screen", modeAudioOnly: "Audio", share: "Stream",
    watchingNow: "WATCHING NOW", people: "People", invite: "Invite", roomChat: "ROOM", chat: "Chat",
    secure: "Messages are temporary and can be translated automatically for each person.",
    messagePlaceholder: "Write a message…", yourName: "What should we call you?",
    yourNameHelp: "This name is shown to the other people in the room.", namePlaceholder: "Your name", continue: "Continue",
    linkCopied: "Invite copied", joined: "You joined the room", invalidCode: "Invalid room code",
    roomFull: "This room is full", sharing: "You are streaming", receiving: "Receiving stream",
    audioOnly: "Receiving audio", shareEnded: "The stream ended", shareError: "Could not start streaming",
    noAudio: "No audio was selected", shareBusy: "is already streaming", translated: "Translated",
    translationFailed: "Translation unavailable", you: "You", owner: "Room creator", viewer: "In the room",
    sharingNow: "Streaming now", onlinePeople: "online", someone: "Someone"
  },
  ru: {
    offline: "Не подключено", online: "Подключено", watchParty: "ПРИВАТНАЯ КОМНАТА",
    together: "Смотрите вместе, где бы вы ни были.",
    intro: "Создайте комнату, пригласите друзей и делитесь вкладкой, экраном или только звуком. Трансляцию может начать любой участник.",
    create: "Создать комнату", enter: "Войти", capacity: "До 8 участников · без аккаунта · автоматический перевод чата",
    everyoneShares: "Транслировать может каждый", everyoneSharesHelp: "Меняйте ведущего трансляции, не создавая новую комнату.",
    groupRoom: "Для компании", groupRoomHelp: "Смотрите, кто подключился, и приглашайте одной ссылкой.",
    translation: "Перевод чата", translationHelp: "Каждый получает сообщения на выбранном языке.",
    room: "КОМНАТА", leave: "Выйти", ready: "Готово к совместному просмотру",
    chooseTab: "Когда кто-то поделится вкладкой, экраном или звуком, трансляция появится здесь.",
    live: "В ЭФИРЕ", playStream: "Включить", waiting: "Ожидание трансляции", stop: "Остановить",
    shareHeading: "Поделиться с комнатой", shareHelp: "Любой участник может начать трансляцию, когда эфир свободен.",
    modeScreenAudio: "Экран + звук", modeScreenOnly: "Экран", modeAudioOnly: "Звук", share: "Транслировать",
    watchingNow: "СЕЙЧАС В КОМНАТЕ", people: "Участники", invite: "Пригласить", roomChat: "КОМНАТА", chat: "Чат",
    secure: "Сообщения временные и могут автоматически переводиться для каждого участника.",
    messagePlaceholder: "Напишите сообщение…", yourName: "Как вас называть?",
    yourNameHelp: "Это имя увидят другие участники комнаты.", namePlaceholder: "Ваше имя", continue: "Продолжить",
    linkCopied: "Ссылка скопирована", joined: "Вы вошли в комнату", invalidCode: "Неверный код",
    roomFull: "Комната заполнена", sharing: "Вы ведёте трансляцию", receiving: "Идёт трансляция",
    audioOnly: "Идёт аудио", shareEnded: "Трансляция завершена", shareError: "Не удалось начать трансляцию",
    noAudio: "Аудио не выбрано", shareBusy: "уже ведёт трансляцию", translated: "Переведено",
    translationFailed: "Перевод недоступен", you: "Вы", owner: "Создатель комнаты", viewer: "В комнате",
    sharingNow: "Сейчас транслирует", onlinePeople: "онлайн", someone: "Участник"
  },
  zh: {
    offline: "未连接", online: "已连接", watchParty: "私人观影房",
    together: "无论大家在哪里，都能一起看。",
    intro: "创建房间，邀请朋友，并共享标签页、整个屏幕或仅音频。房间里的任何人都可以开始直播。",
    create: "创建房间", enter: "加入", capacity: "最多 8 人 · 无需账号 · 聊天自动翻译",
    everyoneShares: "每个人都能直播", everyoneSharesHelp: "无需重建房间即可切换分享者。",
    groupRoom: "为多人而设计", groupRoomHelp: "查看谁已加入，并用一个链接邀请所有人。",
    translation: "聊天翻译", translationHelp: "每个人都能以自己选择的语言接收消息。",
    room: "房间", leave: "离开", ready: "准备一起观看",
    chooseTab: "有人共享标签页、屏幕或音频后，内容会显示在这里。",
    live: "直播", playStream: "播放", waiting: "等待直播", stop: "停止直播",
    shareHeading: "共享到房间", shareHelp: "直播空闲时，任何人都可以开始分享。",
    modeScreenAudio: "屏幕 + 音频", modeScreenOnly: "屏幕", modeAudioOnly: "音频", share: "开始直播",
    watchingNow: "正在观看", people: "成员", invite: "邀请", roomChat: "房间", chat: "聊天",
    secure: "消息是临时的，并可为每位成员自动翻译。",
    messagePlaceholder: "输入消息…", yourName: "怎么称呼你？",
    yourNameHelp: "其他房间成员会看到这个名字。", namePlaceholder: "你的名字", continue: "继续",
    linkCopied: "邀请链接已复制", joined: "你已加入房间", invalidCode: "房间代码无效",
    roomFull: "房间已满", sharing: "你正在直播", receiving: "正在接收直播",
    audioOnly: "正在接收音频", shareEnded: "直播已结束", shareError: "无法开始直播",
    noAudio: "未选择音频", shareBusy: "正在直播", translated: "已翻译",
    translationFailed: "翻译不可用", you: "你", owner: "房间创建者", viewer: "在房间中",
    sharingNow: "正在直播", onlinePeople: "在线", someone: "有人"
  },
};

const browserLanguage = navigator.language.toLowerCase();
let language = browserLanguage.startsWith("ru") ? "ru"
  : browserLanguage.startsWith("zh") ? "zh"
    : browserLanguage.startsWith("en") ? "en"
      : "pt";

let roomId = null;
let selfId = null;
let participants = [];
let activeSharerId = null;
let maxParticipants = 8;
let stream = null;
let iceServersPromise = null;
let reconnecting = false;

const peers = new Map();
const pendingCandidates = new Map();

const fallbackIceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

const t = (key) => translations[language]?.[key] || translations.pt[key] || key;
const participantById = (id) => participants.find((participant) => participant.id === id);
const displayName = () => localStorage.getItem("with-u-name") || "";

function applyLanguage() {
  document.documentElement.lang = { pt: "pt-BR", ru: "ru", en: "en", zh: "zh-CN" }[language];
  elements.language.value = language;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  renderParticipants();
  updateSharingUi();
}

function showToast(text) {
  elements.toast.textContent = text;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2400);
}

function randomRoom() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function roomFromPath() {
  const match = location.pathname.match(/^\/room\/([A-Za-z0-9]{6})$/);
  return match?.[1].toUpperCase() || null;
}

async function ensureName() {
  if (displayName()) return true;

  return new Promise((resolve) => {
    elements.displayName.value = "";
    elements.nameDialog.showModal();
    setTimeout(() => elements.displayName.focus(), 30);

    const submit = (event) => {
      event.preventDefault();
      const name = elements.displayName.value.trim().replace(/\s+/g, " ").slice(0, 24);
      if (!name) {
        elements.displayName.focus();
        return;
      }
      localStorage.setItem("with-u-name", name);
      elements.nameForm.removeEventListener("submit", submit);
      elements.nameDialog.close();
      resolve(true);
    };

    elements.nameForm.addEventListener("submit", submit);
  });
}

async function getIceServers() {
  if (!iceServersPromise) {
    iceServersPromise = fetch("/api/turn-credentials")
      .then((response) => {
        if (!response.ok) throw new Error("TURN unavailable");
        return response.json();
      })
      .then((servers) => Array.isArray(servers) && servers.length ? servers : fallbackIceServers)
      .catch(() => fallbackIceServers);
  }
  return iceServersPromise;
}

async function enterRoom(id, isReconnect = false) {
  if (!/^[A-Z0-9]{6}$/.test(id)) {
    showToast(t("invalidCode"));
    return;
  }

  await ensureName();
  getIceServers();

  socket.emit("join-room", { roomId: id, language, name: displayName() }, (result) => {
    if (!result?.ok) {
      showToast(t(result?.error === "room-full" ? "roomFull" : "invalidCode"));
      if (isReconnect) location.href = "/";
      return;
    }

    roomId = id;
    selfId = result.participantId;
    maxParticipants = result.maxParticipants || 8;
    history.replaceState({}, "", `/room/${roomId}`);
    elements.roomLabel.textContent = roomId;
    elements.lobby.classList.add("hidden");
    document.querySelector(".benefits")?.classList.add("hidden");
    elements.room.classList.remove("hidden");
    applyRoomState(result.state);
    reconnecting = false;
    if (!isReconnect) showToast(t("joined"));
  });
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function renderParticipants() {
  if (!elements.peopleList || !elements.participantStack) return;

  elements.peopleList.innerHTML = "";
  elements.participantStack.innerHTML = "";
  elements.participantCount.textContent = `${participants.length} / ${maxParticipants}`;
  elements.peerStatus.textContent = `${participants.length} ${t("onlinePeople")}`;

  participants.forEach((participant) => {
    const row = document.createElement("div");
    row.className = "person-row";

    const avatar = document.createElement("div");
    avatar.className = "person-avatar";
    avatar.textContent = initials(participant.name);

    const meta = document.createElement("div");
    meta.className = "person-meta";
    const name = document.createElement("strong");
    name.textContent = participant.id === selfId ? `${participant.name} · ${t("you")}` : participant.name;
    const detail = document.createElement("span");
    detail.textContent = participant.id === participants[0]?.id ? t("owner") : t("viewer");
    meta.append(name, detail);
    row.append(avatar, meta);

    if (participant.id === activeSharerId) {
      const badge = document.createElement("span");
      badge.className = "person-live";
      badge.textContent = t("live");
      row.append(badge);
    }

    elements.peopleList.append(row);

    const stackAvatar = document.createElement("span");
    stackAvatar.className = `participant-avatar${participant.id === activeSharerId ? " sharing" : ""}`;
    stackAvatar.textContent = initials(participant.name);
    stackAvatar.title = participant.name;
    elements.participantStack.append(stackAvatar);
  });
}

function applyRoomState(state) {
  if (!state) return;
  participants = state.participants || [];
  activeSharerId = state.activeSharerId || null;
  renderParticipants();
  updateSharingUi();
}

function updateSharingUi() {
  if (!elements.start) return;

  const sharer = participantById(activeSharerId);
  const sharingSelf = activeSharerId === selfId;
  const busy = Boolean(activeSharerId && !sharingSelf);

  elements.start.disabled = busy || sharingSelf;
  elements.start.style.opacity = busy || sharingSelf ? ".5" : "1";
  elements.shareHelp.textContent = busy && sharer
    ? `${sharer.name} ${t("shareBusy")}`
    : t("shareHelp");

  elements.liveBadge.classList.toggle("hidden", !activeSharerId);
  elements.sharerName.textContent = activeSharerId
    ? `${sharer?.name || t("someone")} · ${t("sharingNow")}`
    : "";

  renderParticipants();
}

function closePeer(targetId) {
  const connection = peers.get(targetId);
  if (connection) connection.close();
  peers.delete(targetId);
  pendingCandidates.delete(targetId);
}

function closeAllPeers() {
  [...peers.keys()].forEach(closePeer);
}

async function createPeer(targetId) {
  closePeer(targetId);
  const connection = new RTCPeerConnection({ iceServers: await getIceServers() });
  peers.set(targetId, connection);

  connection.onicecandidate = ({ candidate }) => {
    if (candidate && roomId) {
      socket.emit("signal", { roomId, targetId, payload: { type: "candidate", candidate } });
    }
  };

  connection.onconnectionstatechange = () => {
    if (["failed", "closed"].includes(connection.connectionState)) closePeer(targetId);
  };

  connection.ontrack = async ({ streams }) => {
    if (targetId !== activeSharerId) return;
    const incoming = streams[0];
    const hasVideo = incoming.getVideoTracks().length > 0;

    elements.remote.srcObject = hasVideo ? incoming : null;
    elements.remoteAudio.srcObject = hasVideo ? null : incoming;
    elements.remote.classList.toggle("hidden", !hasVideo);
    elements.remoteAudio.classList.toggle("hidden", hasVideo);
    elements.empty.classList.add("hidden");
    elements.stage.classList.add("live");
    elements.media.textContent = t(hasVideo ? "receiving" : "audioOnly");

    const player = hasVideo ? elements.remote : elements.remoteAudio;
    elements.resume.classList.add("hidden");
    try {
      await player.play();
    } catch {
      elements.resume.classList.remove("hidden");
    }
  };

  return connection;
}

function candidateQueue(targetId) {
  if (!pendingCandidates.has(targetId)) pendingCandidates.set(targetId, []);
  return pendingCandidates.get(targetId);
}

async function flushCandidates(targetId) {
  const connection = peers.get(targetId);
  const queue = candidateQueue(targetId);
  if (!connection?.remoteDescription || queue.length === 0) return;

  while (queue.length) {
    await connection.addIceCandidate(queue.shift());
  }
}

async function makeOffer(targetId) {
  if (!stream || activeSharerId !== selfId || targetId === selfId) return;
  const connection = await createPeer(targetId);
  stream.getTracks().forEach((track) => connection.addTrack(track, stream));
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  socket.emit("signal", { roomId, targetId, payload: { type: "offer", description: offer } });
}

async function handleSignal({ fromId, payload }) {
  try {
    if (payload.type === "offer") {
      const connection = await createPeer(fromId);
      await connection.setRemoteDescription(payload.description);
      await flushCandidates(fromId);
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      socket.emit("signal", { roomId, targetId: fromId, payload: { type: "answer", description: answer } });
      return;
    }

    const connection = peers.get(fromId);

    if (payload.type === "answer" && connection) {
      await connection.setRemoteDescription(payload.description);
      await flushCandidates(fromId);
    } else if (payload.type === "candidate") {
      if (connection?.remoteDescription) await connection.addIceCandidate(payload.candidate);
      else candidateQueue(fromId).push(payload.candidate);
    }
  } catch (error) {
    console.error("WebRTC signal error", error);
  }
}

async function getSharingStream(mode) {
  if (mode === "screen-only") {
    return navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false });
  }

  if (mode === "audio-only") {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    displayStream.getVideoTracks().forEach((track) => track.stop());
    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length > 0) return new MediaStream(audioTracks);
    displayStream.getTracks().forEach((track) => track.stop());
    showToast(t("noAudio"));
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }

  return navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
}

function requestShare() {
  return new Promise((resolve) => {
    socket.emit("begin-share", { roomId }, (result) => resolve(result));
  });
}

async function startSharing() {
  if (!roomId || activeSharerId) return;

  let captured;
  try {
    const mode = document.querySelector("input[name='shareMode']:checked")?.value || "screen-audio";
    captured = await getSharingStream(mode);
    const result = await requestShare();

    if (!result?.ok) {
      captured.getTracks().forEach((track) => track.stop());
      const name = result?.activeSharerName || t("someone");
      showToast(`${name} ${t("shareBusy")}`);
      return;
    }

    stream = captured;
    activeSharerId = selfId;
    const hasVideo = stream.getVideoTracks().length > 0;
    elements.local.srcObject = hasVideo ? stream : null;
    elements.local.classList.toggle("main-preview", hasVideo);
    elements.local.style.display = hasVideo ? "block" : "none";
    elements.remote.classList.add("hidden");
    elements.remoteAudio.classList.add("hidden");
    elements.empty.classList.toggle("hidden", hasVideo);
    elements.stop.classList.remove("hidden");
    elements.stage.classList.add("live");
    elements.media.textContent = t("sharing");
    updateSharingUi();

    stream.getTracks().forEach((track) => {
      track.addEventListener("ended", () => stopSharing(), { once: true });
    });

    await Promise.all(participants.filter((participant) => participant.id !== selfId).map((participant) => makeOffer(participant.id)));
  } catch (error) {
    captured?.getTracks().forEach((track) => track.stop());
    if (activeSharerId === selfId) socket.emit("stop-share", { roomId });
    activeSharerId = null;
    updateSharingUi();
    if (error?.name !== "NotAllowedError") console.error(error);
    showToast(t("shareError"));
  }
}

function resetStage(status = t("waiting")) {
  elements.remote.srcObject = null;
  elements.remote.classList.add("hidden");
  elements.remoteAudio.srcObject = null;
  elements.remoteAudio.classList.add("hidden");
  elements.resume.classList.add("hidden");
  elements.local.srcObject = null;
  elements.local.style.display = "none";
  elements.local.classList.remove("main-preview");
  elements.empty.classList.remove("hidden");
  elements.stage.classList.remove("live");
  elements.stop.classList.add("hidden");
  elements.media.textContent = status;
  $("#stageTitle").textContent = t("ready");
  $("#stageDescription").textContent = t("chooseTab");
}

function stopSharing() {
  if (!stream) return;
  const current = stream;
  stream = null;
  current.getTracks().forEach((track) => {
    track.onended = null;
    if (track.readyState !== "ended") track.stop();
  });
  closeAllPeers();
  socket.emit("stop-share", { roomId });
  activeSharerId = null;
  resetStage();
  updateSharingUi();
}

async function copyInvite() {
  try {
    await navigator.clipboard.writeText(location.href);
    showToast(t("linkCopied"));
  } catch {
    showToast(location.href);
  }
}

function appendMessage(message) {
  const mine = message.senderId === selfId;
  const item = document.createElement("div");
  item.className = `message${mine ? " mine" : ""}`;

  const label = document.createElement("span");
  const translationStatus = message.translated
    ? ` · ${t("translated")}`
    : message.translationFailed ? ` · ${t("translationFailed")}` : "";
  label.textContent = `${mine ? t("you") : message.senderName}${translationStatus}`;

  const body = document.createElement("p");
  body.textContent = message.text;

  item.append(label, body);
  elements.messages.append(item);
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

elements.create.addEventListener("click", () => enterRoom(randomRoom()));
elements.joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  enterRoom(elements.roomInput.value.trim().toUpperCase());
});
elements.roomInput.addEventListener("input", () => {
  elements.roomInput.value = elements.roomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
});
elements.start.addEventListener("click", startSharing);
elements.stop.addEventListener("click", stopSharing);
elements.copy.addEventListener("click", copyInvite);
elements.copySecondary.addEventListener("click", copyInvite);
elements.mobileInvite.addEventListener("click", copyInvite);
elements.mobileShare.addEventListener("click", () => {
  document.querySelector(".share-dock")?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (!activeSharerId) setTimeout(startSharing, 250);
});
elements.mobileChat.addEventListener("click", () => {
  document.querySelector(".chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => elements.chatInput.focus(), 300);
});
elements.resume.addEventListener("click", async () => {
  const player = elements.remote.classList.contains("hidden") ? elements.remoteAudio : elements.remote;
  try {
    await player.play();
    elements.resume.classList.add("hidden");
  } catch {
    showToast(t("shareError"));
  }
});
elements.leave.addEventListener("click", () => {
  stream?.getTracks().forEach((track) => track.stop());
  location.href = "/";
});
elements.chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = elements.chatInput.value.trim();
  if (!text || !roomId) return;
  socket.emit("chat", { roomId, text });
  elements.chatInput.value = "";
});
elements.language.addEventListener("change", () => {
  language = elements.language.value;
  applyLanguage();
  if (roomId) socket.emit("update-profile", { roomId, language, name: displayName() });
});

socket.on("connect", () => {
  elements.connection.classList.add("connected");
  elements.connection.querySelector("span").textContent = t("online");

  if (roomId && selfId && reconnecting) {
    closeAllPeers();
    resetStage();
    enterRoom(roomId, true);
  }
});

socket.on("disconnect", () => {
  elements.connection.classList.remove("connected");
  elements.connection.querySelector("span").textContent = t("offline");
  if (roomId) reconnecting = true;
});

socket.on("room-state", applyRoomState);

socket.on("participant-joined", async (participant) => {
  if (stream && activeSharerId === selfId) {
    await makeOffer(participant.id);
  }
});

socket.on("participant-left", ({ participantId }) => {
  closePeer(participantId);
  if (participantId === activeSharerId) {
    activeSharerId = null;
    resetStage(t("shareEnded"));
    updateSharingUi();
  }
});

socket.on("share-owner", ({ sharerId }) => {
  activeSharerId = sharerId;
  if (sharerId !== selfId) {
    closeAllPeers();
    resetStage(t("waiting"));
  }
  updateSharingUi();
});

socket.on("share-stopped", ({ sharerId }) => {
  closePeer(sharerId);
  if (sharerId === activeSharerId || activeSharerId === null) {
    activeSharerId = null;
    resetStage(t("shareEnded"));
    updateSharingUi();
  }
});

socket.on("signal", handleSignal);
socket.on("chat", appendMessage);

applyLanguage();
const linkedRoom = roomFromPath();
if (linkedRoom) enterRoom(linkedRoom);
