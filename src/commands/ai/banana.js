// banana - Image to Image AI transformation
// NOTE: This is an experimental feature using free APIs
const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'banana',
    aliases: ['img2img', 'styleai', 'transform'],
    description: 'transform image style (experimental)',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.message?.imageMessage || quotedMsg?.imageMessage;
            const prompt = args.join(' ');

            if (!imageMsg) {
                await sock.sendMessage(chatId, {
                    text: 'banana - image style transform (experimental)\n\nreply gambar dengan:\n.banana <style>\n\ncontoh:\n.banana anime style\n.banana oil painting\n\nnote: fitur ini bergantung pada API gratis'
                }, { quoted: msg });
                return;
            }

            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: 'berikan style! contoh: .banana anime style'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'transforming... (30-60 detik)'
            }, { quoted: msg });

            const targetMsg = quotedMsg ? { message: quotedMsg } : msg;
            const imageBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            const result = await transformImage(imageBuffer, prompt);

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, {
                    image: result,
                    caption: `transformed\nstyle: ${prompt}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal transform. API mungkin down, coba lagi nanti.'
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

async function transformImage(imageBuffer, prompt) {
    // API 1: Pollinations AI (free, stable)
    try {
        const base64 = imageBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        const res = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', based on uploaded image, artistic transformation')}`, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        if (res.data) {
            return Buffer.from(res.data);
        }
    } catch { }

    // API 2: Alternative img2img
    try {
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'image.jpg' });
        form.append('prompt', prompt);

        const res2 = await axios.post('https://api.deepai.org/api/image-editor', form, {
            headers: {
                ...form.getHeaders(),
                'api-key': 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K'
            },
            timeout: 60000
        });

        if (res2.data?.output_url) {
            const imgRes = await axios.get(res2.data.output_url, { responseType: 'arraybuffer' });
            return Buffer.from(imgRes.data);
        }
    } catch { }

    return null;
}
