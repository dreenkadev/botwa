// banana - Image to Image AI generation (transform style)
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'banana',
    aliases: ['img2img', 'styleai', 'transform'],
    description: 'transform image style using AI',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.message?.imageMessage || quotedMsg?.imageMessage;
            const prompt = args.join(' ');

            if (!imageMsg) {
                await sock.sendMessage(chatId, {
                    text: 'banana - image to image AI\n\nreply gambar dengan:\n.banana <style>\n\ncontoh:\n.banana anime style\n.banana oil painting'
                }, { quoted: msg });
                return;
            }

            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: 'berikan prompt style! contoh: .banana anime style'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'transforming image... (30-60 detik)'
            }, { quoted: msg });

            // Download image using baileys function
            const targetMsg = quotedMsg ? { message: quotedMsg } : msg;
            const imageBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            const result = await bananaTransform(imageBuffer, prompt);

            await reactDone(sock, msg);

            if (result?.finalUrl) {
                const imgRes = await axios.get(result.finalUrl, {
                    responseType: 'arraybuffer',
                    timeout: 60000
                });

                await sock.sendMessage(chatId, {
                    image: Buffer.from(imgRes.data),
                    caption: `transformed\nstyle: ${prompt}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal transform gambar'
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

async function bananaTransform(imageBuffer, prompt) {
    try {
        const fpId = crypto.randomBytes(16).toString('hex');

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

        if (!uploadRes.data?.success || !uploadRes.data?.url) return null;

        const uploadedUrl = uploadRes.data.url;
        await new Promise(r => setTimeout(r, 2000));

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

        if (!genRes.data?.success || !genRes.data?.request_id) return null;

        const requestId = genRes.data.request_id;

        for (let attempt = 0; attempt < 30; attempt++) {
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
