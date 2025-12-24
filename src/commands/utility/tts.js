// tts - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'tts',
    aliases: ['say', 'speak'],
    description: 'text to speech',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            let text = args.join(' ');
            if (!text && quotedText) text = quotedText;

            if (!text) {
                await sock.sendMessage(chatId, { text: '*tts*\n\n.tts <teks>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let audioBuffer = null;

            // api 1: google tts
            try {
                const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text.substring(0, 200))}&tl=id`;
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                if (res.data) audioBuffer = Buffer.from(res.data);
            } catch { }

            // api 2: voicerss (fallback)
            if (!audioBuffer) {
                try {
                    const url = `https://api.voicerss.org/?key=free&hl=id-id&src=${encodeURIComponent(text.substring(0, 200))}`;
                    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                    if (res.data && res.data.length > 1000) audioBuffer = Buffer.from(res.data);
                } catch { }
            }

            // api 3: streamelements (fallback)
            if (!audioBuffer) {
                try {
                    const url = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(text.substring(0, 200))}`;
                    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                    if (res.data) audioBuffer = Buffer.from(res.data);
                } catch { }
            }

            await reactDone(sock, msg);

            if (audioBuffer) {
                await sock.sendMessage(chatId, { audio: audioBuffer, mimetype: 'audio/mpeg', ptt: true }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'gagal generate' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
