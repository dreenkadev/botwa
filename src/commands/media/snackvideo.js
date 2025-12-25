// snackvideo - Download Snack Video
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'snackvideo',
    aliases: ['snack', 'sv'],
    description: 'download snack video',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];

            if (!url || !url.includes('snackvideo')) {
                await sock.sendMessage(chatId, {
                    text: 'snackvideo\n\n.snackvideo <url>\n\ncontoh:\n.snackvideo https://s.snackvideo.com/xxx'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const result = await downloadSnack(url);

            await reactDone(sock, msg);

            if (result?.url) {
                const videoRes = await axios.get(result.url, {
                    responseType: 'arraybuffer',
                    timeout: 60000
                });

                await sock.sendMessage(chatId, {
                    video: Buffer.from(videoRes.data),
                    caption: result.caption || 'snackvideo'
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal download snackvideo'
                }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function downloadSnack(url) {
    const apis = [
        `https://api.tiklydown.eu.org/api/download/snackvideo?url=${encodeURIComponent(url)}`,
        `https://api.siputzx.my.id/api/dl/snackvideo?url=${encodeURIComponent(url)}`
    ];

    for (const apiUrl of apis) {
        try {
            const res = await axios.get(apiUrl, { timeout: 15000 });

            if (res.data?.result?.video || res.data?.data?.video) {
                return {
                    url: res.data.result?.video || res.data.data?.video,
                    caption: res.data.result?.title || res.data.data?.title || ''
                };
            }
        } catch { }
    }

    return null;
}
