# For U

Sala privada de transmissão para duas pessoas. O host compartilha uma aba, janela ou tela com áudio; a outra pessoa assiste no navegador. A mídia é enviada por WebRTC e o servidor cuida apenas da sala, do chat e da negociação da conexão.

## Executar localmente

Requer Node.js 20 ou mais recente.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`, crie uma sala e envie o link para a outra pessoa.

## Como usar

1. Clique em **Criar uma sala**.
2. Copie o link e envie para sua amiga.
3. Quando ela entrar, clique em **Compartilhar aba ou tela**.
4. No Chrome, selecione a aba desejada e marque **Compartilhar áudio da aba**.

## Produção

O compartilhamento de tela exige HTTPS fora de `localhost`. Para conexões entre redes ou países diferentes, configure um servidor TURN e acrescente suas credenciais em `iceServers` dentro de `public/app.js`; STUN sozinho não atravessa todos os tipos de NAT e firewall.

Este projeto não contorna DRM. Transmita apenas conteúdo que você tenha autorização para compartilhar.
