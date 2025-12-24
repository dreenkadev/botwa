// wiki - dengan fallback bahasa
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'wiki',
    aliases: ['wikipedia'],
    description: 'search wikipedia',

    async execute(sock, msg, { chatId, args }) {
        try {
            const query = args.join(' ');

            if (!query) {
                await sock.sendMessage(chatId, { text: '*wiki*\n\n.wiki <query>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let result = null;

            // api 1: wikipedia indonesia
            try {
                const res = await axios.get(`https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { timeout: 8000 });
                if (res.data?.extract) result = { title: res.data.title, text: res.data.extract };
            } catch { }

            // api 2: wikipedia english (fallback)
            if (!result) {
                try {
                    const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { timeout: 8000 });
                    if (res.data?.extract) result = { title: res.data.title, text: res.data.extract };
                } catch { }
            }

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, { text: `*${result.title}*\n\n${result.text.substring(0, 500)}` }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'tidak ditemukan' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
