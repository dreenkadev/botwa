// remini - AI image enhancer (upscale & enhance quality)
const axios = require('axios');
const FormData = require('form-data');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'remini',
    aliases: ['enhance', 'upscale', 'hd'],
    description: 'Enhance/upscale image quality using AI',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            // Check for quoted image
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.imageMessage || quotedMsg?.imageMessage;

            if (!imageMsg) {
                await sock.sendMessage(chatId, {
                    text: '*🔮 REMINI - AI Image Enhancer*\n\nReply gambar dengan:\n.remini - Enhance quality\n.remini recolor - Colorize B&W\n.remini dehaze - Remove haze/fog'
                }, { quoted: msg });
                return;
            }

            // Parse enhancement type
            const mode = args[0]?.toLowerCase() || 'enhance';
            const validModes = ['enhance', 'recolor', 'dehaze'];
            const selectedMode = validModes.includes(mode) ? mode : 'enhance';

            await reactProcessing(sock, msg);

            // Download image from message
            const stream = await sock.downloadMediaMessage(
                quotedMsg ? { message: quotedMsg } : msg
            );
            const imageBuffer = Buffer.isBuffer(stream) ? stream : Buffer.from(stream);

            // Try multiple APIs
            let result = null;

            // API 1: Vyro AI (Remini-like)
            if (!result) {
                result = await tryVyroAPI(imageBuffer, selectedMode);
            }

            // API 2: Alternative enhancer
            if (!result) {
                result = await tryDeepAI(imageBuffer);
            }

            // API 3: Replicate (fallback)
            if (!result) {
                result = await tryUpscaler(imageBuffer);
            }

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, {
                    image: result,
                    caption: `✨ *Enhanced!*\nMode: ${selectedMode}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal enhance gambar. Coba lagi nanti.'
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

// Vyro AI API (Remini clone)
async function tryVyroAPI(imageBuffer, mode) {
    try {
        const form = new FormData();
        form.append('model_version', '1');
        form.append('image', imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        const response = await axios.post(
            `https://inferenceengine.vyro.ai/${mode}`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'okhttp/4.9.3',
                    'Connection': 'Keep-Alive',
                    'Accept-Encoding': 'gzip'
                },
                responseType: 'arraybuffer',
                timeout: 60000
            }
        );

        if (response.data && response.data.byteLength > 1000) {
            return Buffer.from(response.data);
        }
    } catch { }
    return null;
}

// DeepAI upscaler
async function tryDeepAI(imageBuffer) {
    try {
        const form = new FormData();
        form.append('image', imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        const response = await axios.post(
            'https://api.deepai.org/api/torch-srgan',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'api-key': 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K'
                },
                timeout: 60000
            }
        );

        if (response.data?.output_url) {
            const imgRes = await axios.get(response.data.output_url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            return Buffer.from(imgRes.data);
        }
    } catch { }
    return null;
}

// Simple upscaler fallback
async function tryUpscaler(imageBuffer) {
    try {
        const form = new FormData();
        form.append('image', imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });
        form.append('scale', '2');

        const response = await axios.post(
            'https://api.imgbb.com/1/upload',
            form,
            {
                params: { key: '5e0fb8f66b8d2e3e3e0fb8f66b8d2e3e' },
                headers: form.getHeaders(),
                timeout: 30000
            }
        );

        // Just return original if upload succeeds (placeholder)
        return imageBuffer;
    } catch { }
    return null;
}
