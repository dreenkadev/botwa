// remini - AI image enhancement (upscale, recolor, dehaze)
const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const MODES = ['enhance', 'recolor', 'dehaze'];

module.exports = {
    name: 'remini',
    aliases: ['upscale', 'enhance', 'hdr'],
    description: 'ai image enhancement',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.message?.imageMessage || quotedMsg?.imageMessage;
            const mode = args[0]?.toLowerCase() || 'enhance';

            if (!MODES.includes(mode)) {
                await sock.sendMessage(chatId, {
                    text: `remini\n\nreply gambar + .remini [mode]\n\nmodes: ${MODES.join(', ')}\n\ncontoh:\n.remini enhance\n.remini recolor`
                }, { quoted: msg });
                return;
            }

            if (!imageMsg) {
                await sock.sendMessage(chatId, {
                    text: 'reply gambar dengan: .remini ' + mode
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const targetMsg = quotedMsg ? { message: quotedMsg } : msg;
            const imageBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            const result = await enhanceImage(imageBuffer, mode);

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, {
                    image: result,
                    caption: `enhanced: ${mode}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal enhance gambar'
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

async function enhanceImage(imageBuffer, mode) {
    // API 1: Vyro AI
    try {
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'image.jpg' });
        form.append('model_version', '1');

        const res = await axios.post(`https://inferenceengine.vyro.ai/${mode}`, form, {
            headers: { ...form.getHeaders() },
            responseType: 'arraybuffer',
            timeout: 60000
        });

        if (res.data) return Buffer.from(res.data);
    } catch { }

    // API 2: DeepAI
    try {
        const form2 = new FormData();
        form2.append('image', imageBuffer, { filename: 'image.jpg' });

        const endpoint = mode === 'recolor' ? 'colorizer' : 'torch-srgan';
        const res2 = await axios.post(`https://api.deepai.org/api/${endpoint}`, form2, {
            headers: { ...form2.getHeaders(), 'api-key': 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K' },
            timeout: 60000
        });

        if (res2.data?.output_url) {
            const imgRes = await axios.get(res2.data.output_url, { responseType: 'arraybuffer' });
            return Buffer.from(imgRes.data);
        }
    } catch { }

    return null;
}
