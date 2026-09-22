# With U

[English](README.md) | [Português](README.pt-BR.md) | [Русский](README.ru.md) | [简体中文](README.zh-CN.md)

Uma sala privada para duas pessoas compartilharem uma aba, a tela ou apenas áudio. A mídia viaja diretamente entre os participantes por WebRTC; o servidor Node.js gerencia a sala, a conexão, o chat e a tradução automática.

## Recursos

- Salas privadas com códigos de seis caracteres
- Tela com áudio, somente tela e somente áudio
- Chat temporário em tempo real
- Tradução conforme o idioma escolhido por cada participante
- Interface em português, russo, inglês e chinês simplificado
- Layout responsivo para computador e celular
- Sala encerrada quando o host sai

## Executar localmente

Requer Node.js 20 ou mais recente.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`, crie uma sala e envie o convite.

## Como usar

1. Escolha no topo o idioma em que deseja receber as mensagens.
2. Clique em **Criar uma sala** e copie o convite.
3. Quando a convidada entrar, escolha o modo de transmissão.
4. Clique em **Iniciar transmissão**.
5. Para áudio de aba no Chrome ou Brave, escolha **Aba** e ative **Compartilhar áudio da aba**.

O tradutor gratuito possui cota diária. Se ficar indisponível, a mensagem original será entregue. O texto do chat é enviado ao serviço externo de tradução para processamento.

## Produção

O compartilhamento exige HTTPS fora de `localhost`. Para conexões confiáveis em redes restritivas, crie uma conta no Metered Open Relay e adicione esta variável de ambiente no Render:

```text
METERED_TURN_API_URL=https://SEU_APP.metered.live/api/v1/turn/credentials?apiKey=SUA_API_KEY
```

O servidor busca credenciais temporárias de `iceServers` sem expor a URL da API no navegador ou no repositório. Sem a variável, ou se o provedor estiver indisponível, o aplicativo volta a usar o STUN do Google.

Este projeto não contorna DRM. Transmita apenas conteúdo autorizado.
