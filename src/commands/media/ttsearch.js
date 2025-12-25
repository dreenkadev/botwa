// ttsearch - Search TikTok videos by keyword
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'ttsearch',
    aliases: ['tiktoksearch', 'searchtiktok'],
    description: 'Search TikTok videos by keyword',

    async execute(sock, msg, { chatId, args }) {
        try {
            const query = args.join(' ');

            if (!query) {
                await sock.sendMessage(chatId, {
                    text: '*🔍 TIKTOK SEARCH*\n\nUsage: .ttsearch <keyword>\n\nExample:\n.ttsearch funny cat\n.ttsearch dance tutorial'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const results = await searchTikTok(query);

            await reactDone(sock, msg);

            if (!results || results.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '❌ Tidak ditemukan video untuk: ' + query
                }, { quoted: msg });
                return;
            }

            // Format results
            let response = `*🔍 TIKTOK SEARCH*\n📝 Query: ${query}\n\n`;

            results.slice(0, 5).forEach((video, i) => {
                response += `*${i + 1}. @${video.author}*\n`;
                response += `📝 ${video.title.substring(0, 50)}${video.title.length > 50 ? '...' : ''}\n`;
                response += `❤️ ${video.likes} | 💬 ${video.comments} | 👁️ ${video.views}\n`;
                response += `🔗 ${video.url}\n\n`;
            });

            response += `\n💡 *Tip:* Gunakan .tt <url> untuk download video`;

            await sock.sendMessage(chatId, {
                text: response
            }, { quoted: msg });

        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: '❌ Error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function searchTikTok(query) {
    try {
        const response = await axios.post('https://tikwm.com/api/feed/search', {
            keywords: query,
            count: 10,
            cursor: 0,
            web: 1,
            hd: 1
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Cookie': 'current_language=en',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
            },
            timeout: 15000
        });

        if (response.data?.data?.videos) {
            return response.data.data.videos.map(v => ({
                title: v.title || 'No title',
                author: v.author?.unique_id || 'unknown',
                authorName: v.author?.nickname || 'Unknown',
                url: `https://www.tiktok.com/@${v.author?.unique_id}/video/${v.video_id}`,
                likes: formatNumber(v.digg_count),
                comments: formatNumber(v.comment_count),
                views: formatNumber(v.play_count),
                shares: formatNumber(v.share_count),
                duration: v.duration + 's',
                cover: v.cover,
                videoUrl: v.play
            }));
        }

        return [];
    } catch (err) {
        console.log('TikTok search error:', err.message);
        return [];
    }
}

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
