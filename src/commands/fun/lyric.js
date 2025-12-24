const axios = require('axios');

module.exports = {
    name: 'lyric',
    aliases: ['lyrics', 'lirik'],
    description: 'Search for song lyrics',

    async execute(sock, msg, { chatId, args, quotedText }) {
        let query = args.join(' ');

        if (!query && quotedText) {
            query = quotedText;
        }

        if (!query) {
            await sock.sendMessage(chatId, {
                text: ' Please provide song name!\nUsage: .lyric <song name> or <artist - title>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            // Using lyrics.ovh API (free)
            const parts = query.split('-').map(s => s.trim());
            let artist, title;

            if (parts.length >= 2) {
                artist = parts[0];
                title = parts.slice(1).join(' ');
            } else {
                // Try to search
                artist = query;
                title = query;
            }

            const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, {
                timeout: 15000
            });

            let lyrics = response.data.lyrics;

            if (!lyrics) {
                await sock.sendMessage(chatId, {
                    text: ` No lyrics found for "${query}"\n\nTry format: artist - song title\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
                return;
            }

            // Truncate if too long
            if (lyrics.length > 3000) {
                lyrics = lyrics.substring(0, 3000) + '\n\n... [truncated]';
            }

            await sock.sendMessage(chatId, {
                text: ` *${query}*\n\n${lyrics}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        } catch (err) {
            if (err.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: ` No lyrics found for "${query}"\n\nTry format: artist - song title\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: ' Failed to search lyrics\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
            }
        }
    }
};
