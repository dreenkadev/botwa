// shion - Shion AI roleplay chatbot
const axios = require('axios');
const config = require('../../../config');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'shion',
    aliases: ['shionai', 'waifu-ai'],
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
                    text: 'shion tidak bisa menjawab saat ini'
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
    const shionPrompt = `Kamu adalah Shion, seorang gadis anime yang imut dan ceria. Kamu berbicara dengan gaya yang manis dan kadang tsundere. Kamu suka menggunakan emoticon seperti (≧◡≦), (*^▽^*), (◕‿◕✿). Jawab dalam bahasa yang sama dengan pertanyaan user.

User: ${text}
Shion:`;

    // API 1: Groq (if available)
    if (config.groqApiKey) {
        try {
            const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: shionPrompt }],
                max_tokens: 500
            }, {
                headers: {
                    'Authorization': `Bearer ${config.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (res.data?.choices?.[0]?.message?.content) {
                return res.data.choices[0].message.content.trim();
            }
        } catch { }
    }

    // API 2: Gemini (if available)
    if (config.geminiApiKey) {
        try {
            const geminiRes = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`,
                { contents: [{ parts: [{ text: shionPrompt }] }] },
                { timeout: 30000 }
            );

            if (geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return geminiRes.data.candidates[0].content.parts[0].text.trim();
            }
        } catch { }
    }

    // API 3: Free GPT alternatives
    const freeApis = [
        `https://api.nyxs.pw/ai/gpt4?text=${encodeURIComponent(shionPrompt)}`,
        `https://widipe.com/gpt4?text=${encodeURIComponent(shionPrompt)}`
    ];

    for (const apiUrl of freeApis) {
        try {
            const res = await axios.get(apiUrl, { timeout: 30000 });
            if (res.data?.result) return res.data.result;
        } catch { }
    }

    // Fallback: Simple canned responses
    const responses = [
        `Hai! Shion senang kamu ngobrol sama aku~ (≧◡≦) ${text}? Hmm, menarik!`,
        `E-eh? ${text}? B-bukan berarti aku peduli atau apa ya! (*^▽^*)`,
        `Wah wah~ Kamu tanya tentang ${text.substring(0, 20)}? Shion akan coba jawab! (◕‿◕✿)`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}
