// aivideo - Generate AI video dari text prompt (Veo3-style)
const axios = require('axios');
const FormData = require('form-data');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'aivideo',
    aliases: ['txt2video', 'texttovideo', 'veo'],
    description: 'Generate video dari text prompt menggunakan AI',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const prompt = args.join(' ') || quotedText;

            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: '*🎬 AI VIDEO GENERATOR*\n\nUsage: .aivideo <prompt>\n\n*Example:*\n.aivideo A cute cat playing piano\n.aivideo Sunset at the beach, cinematic\n\n⚠️ Proses generate bisa memakan waktu 1-3 menit.'
                }, { quoted: msg });
                return;
            }

            // Validate prompt (English only for better results)
            if (!/^[a-zA-Z0-9\s.,!?'-]+$/.test(prompt)) {
                await sock.sendMessage(chatId, {
                    text: '⚠️ Gunakan prompt dalam bahasa Inggris untuk hasil terbaik.'
                }, { quoted: msg });
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: '⏳ Generating video... Proses ini bisa memakan waktu 1-3 menit.'
            }, { quoted: msg });

            const result = await generateAIVideo(prompt);

            await reactDone(sock, msg);

            if (result && result.url) {
                // Download video
                const videoRes = await axios.get(result.url, {
                    responseType: 'arraybuffer',
                    timeout: 120000
                });

                await sock.sendMessage(chatId, {
                    video: Buffer.from(videoRes.data),
                    caption: `🎬 *AI Generated Video*\n\n📝 Prompt: ${prompt}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal generate video. ' + (result?.error || 'Coba lagi nanti.')
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

async function generateAIVideo(prompt) {
    // Decrypt token (simple cipher)
    const cipher = 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW';
    const token = decryptCipher(cipher, 3);

    const deviceId = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('');

    try {
        // Step 1: Generate request
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
            return { error: 'Failed to get generation key' };
        }

        const key = genRes.data.key;

        // Step 2: Poll for result
        const maxAttempts = 60;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
                if (data.url && data.url.trim() !== '') {
                    return { url: data.url.trim(), progress: '100%' };
                }
            }
        }

        return { error: 'Timeout - video generation took too long' };
    } catch (err) {
        console.log('AI Video error:', err.message);
        return { error: err.message };
    }
}

function decryptCipher(text, shift) {
    return [...text].map(c => {
        if (/[a-z]/.test(c)) {
            return String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97);
        }
        if (/[A-Z]/.test(c)) {
            return String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65);
        }
        return c;
    }).join('');
}
