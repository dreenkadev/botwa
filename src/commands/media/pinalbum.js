// pinalbum - Pinterest Album search
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'pinalbum',
    aliases: ['pinterestalbum', 'pinsearch'],
    description: 'search pinterest gambar',

    async execute(sock, msg, { chatId, args }) {
        try {
            const query = args.join(' ');

            if (!query) {
                await sock.sendMessage(chatId, {
                    text: 'pinalbum\n\n.pinalbum <keyword>\n\ncontoh:\n.pinalbum anime aesthetic'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const images = await searchPinterest(query, 5);

            await reactDone(sock, msg);

            if (!images?.length) {
                await sock.sendMessage(chatId, {
                    text: 'tidak ditemukan gambar untuk: ' + query
                }, { quoted: msg });
                return;
            }

            for (let i = 0; i < images.length; i++) {
                try {
                    const imgRes = await axios.get(images[i], {
                        responseType: 'arraybuffer',
                        timeout: 15000
                    });

                    await sock.sendMessage(chatId, {
                        image: Buffer.from(imgRes.data),
                        caption: i === 0 ? `pinterest: ${query}` : ''
                    }, { quoted: i === 0 ? msg : undefined });

                    await new Promise(r => setTimeout(r, 500));
                } catch { }
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function searchPinterest(query, count = 5) {
    try {
        const res = await axios.get(`https://api.siputzx.my.id/api/s/pinterest?query=${encodeURIComponent(query)}`, {
            timeout: 15000
        });

        if (res.data?.data) {
            return res.data.data.slice(0, count);
        }
    } catch { }

    try {
        const apiUrl = 'https://www.pinterest.com/resource/BaseSearchResource/get/';
        const params = {
            source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
            data: JSON.stringify({
                options: { isPrefetch: false, query: query, scope: 'pins' },
                context: {}
            }),
            _: Date.now()
        };

        const response = await axios.get(apiUrl, { params, timeout: 15000 });
        const results = response.data?.resource_response?.data?.results || [];

        return results
            .filter(r => r.images?.orig?.url)
            .map(r => r.images.orig.url)
            .slice(0, count);
    } catch { }

    return [];
}
