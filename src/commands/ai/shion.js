// shion - Shion AI roleplay chatbot
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'shion',
    aliases: ['shionai'],
    description: 'chat dengan shion AI',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const text = args.join(' ') || quotedText;

            if (!text) {
                await sock.sendMessage(chatId, {
                    text: 'shion ai\n\n.shion <pesan>\n\ncontoh:\n.shion hai shion!'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const response = await chatWithShion(text);

            await reactDone(sock, msg);

            if (response) {
                await sock.sendMessage(chatId, { text: response }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'shion tidak bisa menjawab'
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

async function chatWithShion(text) {
    try {
        const res = await axios.get(`https://zelapioffciall.koyeb.app/ai/shion?text=${encodeURIComponent(text)}`, {
            timeout: 30000
        });

        if (res.data?.status && res.data?.result?.content) {
            return res.data.result.content.trim();
        }
    } catch { }

    try {
        const fallbackRes = await axios.get(`https://api.siputzx.my.id/api/ai/gpt?prompt=${encodeURIComponent(`Kamu adalah Shion, karakter anime manis. User: ${text}`)}`);
        if (fallbackRes.data?.result) return fallbackRes.data.result;
    } catch { }

    return null;
}
