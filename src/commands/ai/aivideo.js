// aivideo - Generate AI video dari text prompt
// NOTE: Free APIs for AI video generation are extremely limited and unreliable
// This uses multiple fallbacks but may fail if all APIs are down
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'aivideo',
    aliases: ['txt2video', 'texttovideo', 'veo'],
    description: 'generate video from text (experimental)',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const prompt = args.join(' ') || quotedText;

            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: 'aivideo (experimental)\n\n.aivideo <prompt>\n\nnote: fitur ini bergantung pada API gratis yang mungkin tidak stabil'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'generating video... (proses bisa sampai 3 menit)'
            }, { quoted: msg });

            const result = await generateAIVideo(prompt);

            await reactDone(sock, msg);

            if (result?.url) {
                try {
                    const videoRes = await axios.get(result.url, {
                        responseType: 'arraybuffer',
                        timeout: 120000
                    });

                    await sock.sendMessage(chatId, {
                        video: Buffer.from(videoRes.data),
                        caption: `ai video\nprompt: ${prompt}`
                    }, { quoted: msg });
                } catch {
                    await sock.sendMessage(chatId, {
                        text: `video generated tapi gagal download\nlink: ${result.url}`
                    }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal generate video. API mungkin sedang down atau rate limited. coba lagi nanti.'
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

async function generateAIVideo(prompt) {
    // Try multiple APIs

    // API 1: Luma via different endpoint
    try {
        const lumaRes = await axios.get(`https://api.vreden.my.id/api/luma?prompt=${encodeURIComponent(prompt)}`, {
            timeout: 180000
        });
        if (lumaRes.data?.result?.url) {
            return { url: lumaRes.data.result.url };
        }
    } catch { }

    // API 2: RunwayML alternative
    try {
        const runwayRes = await axios.get(`https://widipe.com/runway?text=${encodeURIComponent(prompt)}`, {
            timeout: 180000
        });
        if (runwayRes.data?.result) {
            return { url: runwayRes.data.result };
        }
    } catch { }

    // API 3: Kling alternative  
    try {
        const klingRes = await axios.get(`https://api.betabotz.eu.org/api/search/kling?text=${encodeURIComponent(prompt)}&apikey=free`, {
            timeout: 180000
        });
        if (klingRes.data?.result) {
            return { url: klingRes.data.result };
        }
    } catch { }

    return null;
}
