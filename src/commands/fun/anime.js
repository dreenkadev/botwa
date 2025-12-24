const axios = require('axios');

module.exports = {
    name: 'anime',
    aliases: ['mal'],
    description: 'Search anime info from MyAnimeList',

    async execute(sock, msg, { chatId, args }) {
        const query = args.join(' ');

        if (!query) {
            await sock.sendMessage(chatId, {
                text: ' Please provide anime name!\nUsage: .anime <title>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, {
                timeout: 15000
            });

            const data = response.data.data?.[0];

            if (!data) {
                await sock.sendMessage(chatId, {
                    text: ` No anime found for "${query}"\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
                return;
            }

            const genres = data.genres?.map(g => g.name).join(', ') || 'N/A';
            const studios = data.studios?.map(s => s.name).join(', ') || 'N/A';

            let synopsis = data.synopsis || 'No synopsis available';
            if (synopsis.length > 500) {
                synopsis = synopsis.substring(0, 500) + '...';
            }

            const text = ` *${data.title}*
${data.title_japanese ? `(${data.title_japanese})` : ''}

 Score: ${data.score || 'N/A'} (${data.scored_by?.toLocaleString() || 0} votes)
 Rank: #${data.rank || 'N/A'} | Popularity: #${data.popularity || 'N/A'}
 Type: ${data.type || 'N/A'}
 Status: ${data.status || 'N/A'}
 Episodes: ${data.episodes || 'N/A'}
 Duration: ${data.duration || 'N/A'}
 Genres: ${genres}
 Studios: ${studios}

 *Synopsis:*
${synopsis}

 ${data.url}

𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            if (data.images?.jpg?.image_url) {
                try {
                    const imgResponse = await axios.get(data.images.jpg.image_url, {
                        responseType: 'arraybuffer',
                        timeout: 10000
                    });
                    await sock.sendMessage(chatId, {
                        image: Buffer.from(imgResponse.data),
                        caption: text
                    }, { quoted: msg });
                    return;
                } catch { }
            }

            await sock.sendMessage(chatId, { text }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ' Failed to search anime\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};
