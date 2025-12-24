const axios = require('axios');
const config = require('../../config');

require('dotenv').config();

// model fallback list (terbaru ke lama)
const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it'
];

async function askAI(prompt) {
    const apiKey = config.groqApiKey || process.env.GROQ_API_KEY;

    if (!apiKey) {
        return 'ai belum dikonfigurasi. set GROQ_API_KEY di .env';
    }

    // coba setiap model sampai berhasil
    for (const model of GROQ_MODELS) {
        try {
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: model,
                    messages: [
                        { role: 'system', content: 'kamu asisten yang helpful. jawab sesuai bahasa user. singkat dan jelas.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                },
                {
                    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                    timeout: 30000
                }
            );

            const result = response.data?.choices?.[0]?.message?.content;
            if (result) return result.trim();
        } catch (err) {
            // jika model deprecated/tidak tersedia, coba model berikutnya
            if (err.response?.data?.error?.code === 'model_decommissioned' ||
                err.response?.data?.error?.code === 'model_not_found') {
                continue;
            }
            // rate limit - langsung return
            if (err.response?.status === 429) {
                return 'rate limit. coba lagi nanti.';
            }
            // error lain - coba model berikutnya
            continue;
        }
    }

    // jika semua groq gagal, coba fallback ke free API
    try {
        const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(prompt)}&owner=bot&botname=ai`, { timeout: 10000 });
        if (res.data?.response) return res.data.response;
    } catch { }

    return 'ai tidak tersedia saat ini';
}

module.exports = { askAI };
