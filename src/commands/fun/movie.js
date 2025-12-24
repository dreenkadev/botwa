const axios = require('axios');

module.exports = {
    name: 'movie',
    aliases: ['film', 'imdb'],
    description: 'Search movie info from OMDB/IMDB',

    async execute(sock, msg, { chatId, args }) {
        const query = args.join(' ');

        if (!query) {
            await sock.sendMessage(chatId, {
                text: ' Please provide movie name!\nUsage: .movie <title>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            // Using OMDB API (free tier)
            const response = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(query)}&apikey=1a2b3c4d`, {
                timeout: 10000
            });

            // Fallback to free API if OMDB fails
            if (response.data.Response === 'False') {
                // Try alternative free movie API
                const altResponse = await axios.get(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(query)}`, {
                    timeout: 10000
                });

                if (altResponse.data) {
                    const show = altResponse.data;
                    let summary = show.summary?.replace(/<[^>]*>/g, '') || 'No summary available';
                    if (summary.length > 500) summary = summary.substring(0, 500) + '...';

                    const text = ` *${show.name}*

 Rating: ${show.rating?.average || 'N/A'}/10
 Type: ${show.type || 'N/A'}
 Genres: ${show.genres?.join(', ') || 'N/A'}
 Status: ${show.status || 'N/A'}
 Runtime: ${show.runtime || 'N/A'} min
 Language: ${show.language || 'N/A'}
 Premiered: ${show.premiered || 'N/A'}

 *Summary:*
${summary}

 ${show.url}

𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

                    if (show.image?.original) {
                        try {
                            const imgRes = await axios.get(show.image.original, {
                                responseType: 'arraybuffer',
                                timeout: 10000
                            });
                            await sock.sendMessage(chatId, {
                                image: Buffer.from(imgRes.data),
                                caption: text
                            }, { quoted: msg });
                            return;
                        } catch { }
                    }

                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                    return;
                }

                await sock.sendMessage(chatId, {
                    text: ` No movie/show found for "${query}"\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
                return;
            }

            const data = response.data;
            let plot = data.Plot || 'No plot available';
            if (plot.length > 500) plot = plot.substring(0, 500) + '...';

            const text = ` *${data.Title}* (${data.Year})

 IMDB: ${data.imdbRating || 'N/A'}/10
 Rottem: ${data.Ratings?.find(r => r.Source.includes('Rotten'))?.Value || 'N/A'}
 Type: ${data.Type || 'N/A'}
 Genre: ${data.Genre || 'N/A'}
 Released: ${data.Released || 'N/A'}
 Runtime: ${data.Runtime || 'N/A'}
 Director: ${data.Director || 'N/A'}
 Writer: ${data.Writer || 'N/A'}
 Actors: ${data.Actors || 'N/A'}
 Country: ${data.Country || 'N/A'}
 Awards: ${data.Awards || 'N/A'}

 *Plot:*
${plot}

𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ' Failed to search movie\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};
