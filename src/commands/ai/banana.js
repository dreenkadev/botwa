// banana - Image to Image AI generation (transform style)
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'banana',
    aliases: ['img2img', 'styleai', 'transform'],
    description: 'Transform image style using AI (img2img)',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.imageMessage || quotedMsg?.imageMessage;
            const prompt = args.join(' ');

            if (!imageMsg) {
                await sock.sendMessage(chatId, {
                    text: `*🍌 BANANA - Image to Image AI*\n\nReply gambar dengan:\n.banana <style prompt>\n\n*Example:*\nReply foto + .banana anime style\nReply foto + .banana cyberpunk neon\nReply foto + .banana oil painting\nReply foto + .banana studio ghibli style`
                }, { quoted: msg });
                return;
            }

            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: '❌ Berikan prompt style! Contoh: .banana anime style'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: '⏳ Transforming image... Proses ini bisa memakan waktu 30-60 detik.'
            }, { quoted: msg });

            // Download image
            const stream = await sock.downloadMediaMessage(
                quotedMsg ? { message: quotedMsg } : msg
            );
            const imageBuffer = Buffer.isBuffer(stream) ? stream : Buffer.from(stream);

            // Process with Banana AI
            const result = await bananaTransform(imageBuffer, prompt);

            await reactDone(sock, msg);

            if (result && result.finalUrl) {
                // Download result
                const imgRes = await axios.get(result.finalUrl, {
                    responseType: 'arraybuffer',
                    timeout: 60000
                });

                await sock.sendMessage(chatId, {
                    image: Buffer.from(imgRes.data),
                    caption: `🍌 *Image Transformed!*\n📝 Style: ${prompt}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal transform gambar. Coba prompt yang berbeda.'
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

async function bananaTransform(imageBuffer, prompt) {
    try {
        const fpId = crypto.randomBytes(16).toString('hex');

        // Step 1: Upload image
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'image.jpg' });

        const uploadRes = await axios.post('https://nanana.app/api/upload-img', form, {
            headers: {
                ...form.getHeaders(),
                'accept': '*/*',
                'x-fp-id': fpId,
                'Referer': 'https://nanana.app/en'
            },
            timeout: 30000
        });

        if (!uploadRes.data?.success || !uploadRes.data?.url) {
            return null;
        }

        const uploadedUrl = uploadRes.data.url;

        // Wait a bit
        await new Promise(r => setTimeout(r, 2000));

        // Step 2: Generate
        const genRes = await axios.post('https://nanana.app/api/image-to-image', {
            prompt: prompt,
            image_urls: [uploadedUrl]
        }, {
            headers: {
                'content-type': 'application/json',
                'x-fp-id': fpId,
                'Referer': 'https://nanana.app/en'
            },
            timeout: 30000
        });

        if (!genRes.data?.success || !genRes.data?.request_id) {
            return null;
        }

        const requestId = genRes.data.request_id;

        // Step 3: Poll for result
        const maxAttempts = 30;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(r => setTimeout(r, 5000));

            const resultRes = await axios.post('https://nanana.app/api/get-result', {
                requestId: requestId,
                type: 'image-to-image'
            }, {
                headers: {
                    'content-type': 'application/json',
                    'x-fp-id': fpId,
                    'Referer': 'https://nanana.app/en'
                },
                timeout: 15000
            });

            if (resultRes.data?.completed && resultRes.data?.data?.images?.length > 0) {
                return {
                    uploadedUrl,
                    requestId,
                    finalUrl: resultRes.data.data.images[0].url,
                    status: 'completed'
                };
            }
        }

        return null;
    } catch (err) {
        console.log('Banana error:', err.message);
        return null;
    }
}
