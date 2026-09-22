# For U

[English](README.md) | [Português](README.pt-BR.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md)

A private two-person room for sharing a browser tab, screen, or audio. Media travels directly between participants over WebRTC; the Node.js server manages room presence, signaling, chat, and automatic message translation.

## Features

- Private rooms with six-character invite codes
- Screen with audio, screen only, and audio-only modes
- Temporary real-time chat
- Automatic translation based on each participant's language selector
- Portuguese, Russian, English, and Simplified Chinese interface
- Responsive desktop and mobile layout
- Host-owned rooms that close when the host leaves

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, create a room, and send the invite link to the other person.

## How to use

1. Select the language in which you want to receive chat messages.
2. Click **Create a room** and copy the invite link.
3. After the guest joins, choose **Screen + audio**, **Screen only**, or **Audio only**.
4. Click **Start streaming**.
5. For tab audio in Chrome or Brave, select **Tab** and enable **Share tab audio**.

The free translation service has a daily character quota. If translation is unavailable, the original message is delivered instead. Chat text is sent to the external translation provider for processing.

## Production

Screen sharing requires HTTPS outside `localhost`. Configure a TURN server in the `iceServers` array in `public/app.js` for reliable connections across restrictive NATs and firewalls; STUN alone cannot handle every network.

This project does not bypass DRM. Only stream content you are authorized to share.
