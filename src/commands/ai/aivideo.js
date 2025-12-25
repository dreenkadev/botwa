// aivideo - Generate AI video dari text prompt (Veo3-style)
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'aivideo',
    aliases: ['txt2video', 'texttovideo', 'veo'],
    description: 'generate video from text prompt',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const prompt = args.join(' ') || quotedText;

            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: 'aivideo\n\n.aivideo <prompt>\n\ncontoh:\n.aivideo a cat playing piano\n.aivideo sunset at beach, cinematic'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'generating video... (1-3 menit)'
            }, { quoted: msg });

            const result = await generateAIVideo(prompt);

            await reactDone(sock, msg);

            if (result?.url) {
                const videoRes = await axios.get(result.url, {
                    responseType: 'arraybuffer',
                    timeout: 120000
                });

                await sock.sendMessage(chatId, {
                    video: Buffer.from(videoRes.data),
                    caption: `ai video\nprompt: ${prompt}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal generate video. ' + (result?.error || 'coba lagi')
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
    const cipher = 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW';
    const token = decryptCipher(cipher, 3);

    const deviceId = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('');

    try {
        const genRes = await axios.post('https://text2video.aritek.app/txt2videov3', {
            deviceID: deviceId,
            isPremium: 1,
            prompt: prompt,
            used: [],
            versionCode: 59
        }, {
            headers: {
                'user-agent': 'NB Android/1.0.0',
                'content-type': 'application/json',
                'authorization': token
            },
            timeout: 30000
        });

        if (genRes.data?.code !== 0 || !genRes.data?.key) {
            return { error: 'failed to get key' };
        }

        const key = genRes.data.key;

        for (let attempt = 0; attempt < 60; attempt++) {
            await new Promise(r => setTimeout(r, 3000));

            const videoRes = await axios.post('https://text2video.aritek.app/video', {
                keys: [key]
            }, {
                headers: {
                    'user-agent': 'NB Android/1.0.0',
                    'content-type': 'application/json',
                    'authorization': token
                },
                timeout: 15000
            });

            if (videoRes.data?.code === 0 && videoRes.data?.datas?.[0]) {
                const data = videoRes.data.datas[0];
                if (data.url?.trim()) {
                    return { url: data.url.trim() };
                }
            }
        }

        return { error: 'timeout' };
    } catch (err) {
        return { error: err.message };
    }
}

function decryptCipher(text, shift) {
    return [...text].map(c => {
        if (/[a-z]/.test(c)) return String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97);
        if (/[A-Z]/.test(c)) return String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65);
        return c;
    }).join('');
}
