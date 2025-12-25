// pinalbum - Pinterest Album search (multiple images)
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'pinalbum',
    aliases: ['pinterestalbum', 'pinsearch'],
    description: 'Search Pinterest dan kirim banyak gambar sekaligus',

    async execute(sock, msg, { chatId, args }) {
        try {
            const query = args.join(' ');

            if (!query) {
                await sock.sendMessage(chatId, {
                    text: '*📌 PINTEREST ALBUM*\n\nUsage: .pinalbum <keyword>\n\nExample:\n.pinalbum anime aesthetic\n.pinalbum wallpaper 4k'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const images = await searchPinterestMultiple(query, 5);

            await reactDone(sock, msg);

            if (!images || images.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '❌ Tidak ada gambar ditemukan untuk: ' + query
                }, { quoted: msg });
                return;
            }

            // Send images one by one (album style)
            for (let i = 0; i < images.length; i++) {
                try {
                    const imgRes = await axios.get(images[i], {
                        responseType: 'arraybuffer',
                        timeout: 15000
                    });

                    await sock.sendMessage(chatId, {
                        image: Buffer.from(imgRes.data),
                        caption: i === 0 ? `📌 *Pinterest Album*\n🔍 Query: ${query}\n📸 Result: ${images.length} images` : ''
                    }, { quoted: i === 0 ? msg : undefined });

                    // Small delay between sends
                    await new Promise(r => setTimeout(r, 500));
                } catch { }
            }

        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: '❌ Error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function searchPinterestMultiple(query, count = 5) {
    try {
        // Method 1: Pinterest API search
        const apiUrl = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
        const params = {
            source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
            data: JSON.stringify({
                options: {
                    isPrefetch: false,
                    query: query,
                    scope: 'pins',
                    no_fetch_context_on_resource: false
                },
                context: {}
            }),
            _: Date.now()
        };

        const response = await axios.get(apiUrl, {
            params,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        });

        const results = response.data?.resource_response?.data?.results || [];
        const images = results
            .filter(r => r.images?.orig?.url)
            .map(r => r.images.orig.url)
            .slice(0, count);

        if (images.length > 0) return images;

        // Fallback: Use alternative Pinterest scraper
        const fallbackRes = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`, {
            timeout: 15000
        });

        if (fallbackRes.data?.data) {
            return fallbackRes.data.data.slice(0, count);
        }

        return [];
    } catch (err) {
        console.log('Pinterest Album error:', err.message);
        return [];
    }
}
