const axios = require('axios');

module.exports = {
    name: 'kbbi',
    aliases: ['kamus', 'arti'],
    description: 'Cari kata di KBBI (Kamus Besar Bahasa Indonesia)',

    async execute(sock, msg, { chatId, args }) {
        const word = args.join(' ');

        if (!word) {
            await sock.sendMessage(chatId, {
                text: '📖 *KBBI - Kamus Besar Bahasa Indonesia*\n\nUsage: .kbbi <kata>\n\nContoh: .kbbi belajar\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            const response = await axios.get(`https://kbbi.kemdikbud.go.id/entri/${encodeURIComponent(word)}`, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            // Parse HTML response for definitions
            const html = response.data;

            // Simple regex to extract meanings
            const meanings = [];
            const regex = /<li>(.*?)<\/li>/gi;
            let match;
            while ((match = regex.exec(html)) !== null && meanings.length < 5) {
                const cleaned = match[1].replace(/<[^>]*>/g, '').trim();
                if (cleaned && cleaned.length > 5) {
                    meanings.push(cleaned);
                }
            }

            if (meanings.length === 0) {
                // Fallback - try alternative
                const altResponse = await axios.get(`https://kateglo.com/api.php?format=json&phrase=${encodeURIComponent(word)}`, {
                    timeout: 10000
                });

                const data = altResponse.data?.kateglo?.definition;
                if (data && data.length > 0) {
                    let text = `📖 *KBBI - ${word}*\n\n`;
                    data.slice(0, 5).forEach((def, i) => {
                        text += `${i + 1}. ${def.def_text}\n`;
                    });
                    text += '\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃';
                    await sock.sendMessage(chatId, { text }, { quoted: msg });
                    return;
                }

                throw new Error('Not found');
            }

            let text = `📖 *KBBI - ${word}*\n\n`;
            meanings.forEach((m, i) => { text += `${i + 1}. ${m}\n`; });
            text += '\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃';

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch {
            await sock.sendMessage(chatId, {
                text: `Kata "${word}" tidak ditemukan di KBBI\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        }
    }
};
