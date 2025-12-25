// ttsearch - Search TikTok videos
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'ttsearch',
    aliases: ['tiksearch', 'searchtiktok'],
    description: 'search video tiktok',

    async execute(sock, msg, { chatId, args }) {
        try {
            const keyword = args.join(' ');

            if (!keyword) {
                await sock.sendMessage(chatId, {
                    text: 'ttsearch\n\n.ttsearch <keyword>\n\ncontoh:\n.ttsearch funny cat'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const results = await searchTikTok(keyword);

            await reactDone(sock, msg);

            if (results?.length > 0) {
                let text = `search: ${keyword}\n\n`;
                results.slice(0, 5).forEach((v, i) => {
                    text += `${i + 1}. ${v.title || 'No title'}\n`;
                    text += `   ${v.url}\n\n`;
                });
                text += 'gunakan .tt <url> untuk download';

                await sock.sendMessage(chatId, { text }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'tidak ditemukan video untuk: ' + keyword
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

async function searchTikTok(keyword) {
    try {
        const res = await axios.get(`https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(keyword)}&count=10`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
        });

        if (res.data?.data?.videos) {
            return res.data.data.videos.map(v => ({
                title: v.title,
                url: `https://www.tiktok.com/@${v.author?.unique_id}/video/${v.video_id}`
            }));
        }
    } catch { }

    try {
        const res2 = await axios.get(`https://api.tiklydown.eu.org/api/search/tiktok?query=${encodeURIComponent(keyword)}`, {
            timeout: 15000
        });

        if (res2.data?.result) {
            return res2.data.result.map(v => ({
                title: v.desc,
                url: v.play
            }));
        }
    } catch { }

    return [];
}
