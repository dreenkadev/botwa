// snackvideo - Download Snack Video
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'snackvideo',
    aliases: ['snack', 'sv'],
    description: 'Download video from Snack Video',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];

            if (!url || !url.includes('snack')) {
                await sock.sendMessage(chatId, {
                    text: '*📹 SNACK VIDEO DOWNLOADER*\n\nUsage: .snackvideo <url>\n\nExample:\n.snackvideo https://s.snackvideo.com/xxx'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const result = await downloadSnackVideo(url);

            await reactDone(sock, msg);

            if (!result || !result.videoUrl) {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal download video. Pastikan URL valid.'
                }, { quoted: msg });
                return;
            }

            // Download video buffer
            const videoRes = await axios.get(result.videoUrl, {
                responseType: 'arraybuffer',
                timeout: 60000
            });

            const caption = `*📹 SNACK VIDEO*\n\n` +
                `👤 *Author:* ${result.author || 'Unknown'}\n` +
                `📝 *Title:* ${result.title || 'No title'}\n` +
                `❤️ *Likes:* ${result.likes || '0'}`;

            await sock.sendMessage(chatId, {
                video: Buffer.from(videoRes.data),
                caption
            }, { quoted: msg });

        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: '❌ Error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function downloadSnackVideo(url) {
    try {
        // Try API 1
        const res = await axios.get(`https://api.siputzx.my.id/api/d/snackvideo?url=${encodeURIComponent(url)}`, {
            timeout: 15000
        });

        if (res.data?.status && res.data?.data) {
            const data = res.data.data;
            return {
                videoUrl: data.video_url || data.url,
                author: data.author?.username || data.author,
                title: data.title || data.caption,
                likes: data.like_count || data.likes
            };
        }

        // Try API 2 (fallback)
        const res2 = await axios.get(`https://api.tiklydown.eu.org/api/download/snackvideo?url=${encodeURIComponent(url)}`, {
            timeout: 15000
        });

        if (res2.data?.video) {
            return {
                videoUrl: res2.data.video,
                author: res2.data.author,
                title: res2.data.title,
                likes: res2.data.likes
            };
        }

        return null;
    } catch (err) {
        console.log('Snack Video error:', err.message);
        return null;
    }
}
