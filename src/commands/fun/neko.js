// neko - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'neko',
    aliases: ['cat', 'kucing'],
    description: 'random gambar kucing',

    async execute(sock, msg, { chatId, args }) {
        try {
            const type = args[0]?.toLowerCase() || 'random';
            await reactProcessing(sock, msg);

            let imageBuffer = null;

            if (type === 'anime') {
                // api 1: waifu.pics
                try {
                    const res = await axios.get('https://api.waifu.pics/sfw/neko', { timeout: 8000 });
                    if (res.data?.url) {
                        const img = await axios.get(res.data.url, { responseType: 'arraybuffer', timeout: 10000 });
                        imageBuffer = Buffer.from(img.data);
                    }
                } catch { }

                // api 2: nekos.life fallback
                if (!imageBuffer) {
                    try {
                        const res = await axios.get('https://nekos.life/api/v2/img/neko', { timeout: 8000 });
                        if (res.data?.url) {
                            const img = await axios.get(res.data.url, { responseType: 'arraybuffer', timeout: 10000 });
                            imageBuffer = Buffer.from(img.data);
                        }
                    } catch { }
                }
            } else {
                // api 1: cataas
                try {
                    const img = await axios.get(`https://cataas.com/cat?${Date.now()}`, { responseType: 'arraybuffer', timeout: 10000 });
                    imageBuffer = Buffer.from(img.data);
                } catch { }

                // api 2: thecatapi fallback
                if (!imageBuffer) {
                    try {
                        const res = await axios.get('https://api.thecatapi.com/v1/images/search', { timeout: 8000 });
                        if (res.data?.[0]?.url) {
                            const img = await axios.get(res.data[0].url, { responseType: 'arraybuffer', timeout: 10000 });
                            imageBuffer = Buffer.from(img.data);
                        }
                    } catch { }
                }
            }

            await reactDone(sock, msg);

            if (imageBuffer) {
                await sock.sendMessage(chatId, { image: imageBuffer, caption: type === 'anime' ? 'neko' : 'kucing' }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
