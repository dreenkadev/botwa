// pinterest - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'pinterest',
    aliases: ['pin'],
    description: 'search gambar pinterest',

    async execute(sock, msg, { chatId, args }) {
        try {
            const query = args.join(' ');

            if (!query) {
                await sock.sendMessage(chatId, { text: '*pinterest*\n\n.pin <query>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let images = [];

            // api 1: lolhuman
            try {
                const res = await axios.get(`https://api.lolhuman.xyz/api/pinterest?apikey=free&query=${encodeURIComponent(query)}`, { timeout: 10000 });
                if (res.data?.result?.length) images = res.data.result.slice(0, 3);
            } catch { }

            // api 2: popcat (fallback)
            if (images.length === 0) {
                try {
                    const res = await axios.get(`https://api.popcat.xyz/pinterest?s=${encodeURIComponent(query)}`, { timeout: 10000 });
                    if (res.data?.results?.length) images = res.data.results.slice(0, 3);
                } catch { }
            }

            await reactDone(sock, msg);

            if (images.length === 0) {
                await sock.sendMessage(chatId, { text: 'tidak ditemukan' }, { quoted: msg });
                return;
            }

            for (const url of images) {
                try {
                    const imgRes = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                    await sock.sendMessage(chatId, { image: Buffer.from(imgRes.data) }, { quoted: msg });
                } catch { }
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
