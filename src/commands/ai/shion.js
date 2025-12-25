// shion - Shion AI roleplay chatbot
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'shion',
    aliases: ['shionai'],
    description: 'Chat dengan Shion AI (roleplay character)',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const text = args.join(' ') || quotedText;

            if (!text) {
                await sock.sendMessage(chatId, {
                    text: '*🎀 SHION AI*\n\nHai! Aku Shion~ Ayo ngobrol denganku!\n\nUsage: .shion <pesan>\n\nExample:\n.shion Hai Shion, apa kabar?\n.shion Ceritakan tentang dirimu'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const response = await chatWithShion(text);

            await reactDone(sock, msg);

            if (response) {
                await sock.sendMessage(chatId, {
                    text: response
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Shion sedang tidak bisa menjawab. Coba lagi nanti~'
                }, { quoted: msg });
            }

        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: '❌ Error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function chatWithShion(text) {
    try {
        // API 1: ZelAPI Shion
        const res = await axios.get(`https://zelapioffciall.koyeb.app/ai/shion?text=${encodeURIComponent(text)}`, {
            timeout: 30000
        });

        if (res.data?.status && res.data?.result?.content) {
            return res.data.result.content.trim();
        }

        // Fallback: Generic AI with Shion personality
        const fallbackRes = await axios.get(`https://api.siputzx.my.id/api/ai/gpt?prompt=${encodeURIComponent(`Kamu adalah Shion, karakter anime perempuan yang manis dan ceria. Jawab dengan gaya bicara anime yang imut. User berkata: ${text}`)}`);

        if (fallbackRes.data?.result) {
            return fallbackRes.data.result;
        }

        return null;
    } catch (err) {
        console.log('Shion AI error:', err.message);
        return null;
    }
}
