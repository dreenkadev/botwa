// waifu - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const APIS = [
    { name: 'waifu.pics', url: cat => `https://api.waifu.pics/sfw/${cat}`, parse: d => d.url },
    { name: 'nekos.life', url: cat => `https://nekos.life/api/v2/img/${cat === 'waifu' ? 'waifu' : 'neko'}`, parse: d => d.url }
];

module.exports = {
    name: 'waifu',
    aliases: ['animegirl', 'wf'],
    description: 'random gambar waifu',

    async execute(sock, msg, { chatId, args }) {
        try {
            const category = args[0] || 'waifu';
            const categories = ['waifu', 'neko', 'shinobu', 'megumin', 'cuddle', 'hug', 'pat', 'smug', 'bonk', 'blush', 'smile', 'wave', 'happy', 'dance'];

            if (!categories.includes(category)) {
                await sock.sendMessage(chatId, { text: `*waifu*\n\n.waifu [category]\n\n${categories.join(', ')}` }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let imageUrl = null;
            for (const api of APIS) {
                try {
                    const res = await axios.get(api.url(category), { timeout: 8000 });
                    imageUrl = api.parse(res.data);
                    if (imageUrl) break;
                } catch { }
            }

            if (!imageUrl) {
                await reactDone(sock, msg);
                await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
                return;
            }

            const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { image: Buffer.from(imgRes.data), caption: category }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
