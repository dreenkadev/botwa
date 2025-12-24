// translate - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'translate',
    aliases: ['tr', 'tl'],
    description: 'terjemahkan teks',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const targetLang = args[0] || 'id';
            let text = args.slice(1).join(' ');
            if (!text && quotedText) text = quotedText;

            if (!text) {
                await sock.sendMessage(chatId, { text: '*translate*\n\n.tr <bahasa> <teks>\ncontoh: .tr en halo apa kabar' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let translated = null;

            // api 1: mymemory
            try {
                const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`, { timeout: 8000 });
                if (res.data?.responseData?.translatedText) translated = res.data.responseData.translatedText;
            } catch { }

            // api 2: libretranslate (fallback)
            if (!translated) {
                try {
                    const res = await axios.post('https://libretranslate.com/translate', {
                        q: text, source: 'auto', target: targetLang
                    }, { timeout: 8000 });
                    if (res.data?.translatedText) translated = res.data.translatedText;
                } catch { }
            }

            await reactDone(sock, msg);

            if (translated) {
                await sock.sendMessage(chatId, { text: `*translate*\n\n${text}\n\n(${targetLang}): ${translated}` }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'gagal translate' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
