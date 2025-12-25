// removebg - Remove background from image
const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'removebg',
    aliases: ['rmbg', 'nobg'],
    description: 'hapus background gambar',

    async execute(sock, msg, { chatId, mediaMessage }) {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.message?.imageMessage || quotedMsg?.imageMessage;

            if (!imageMsg) {
                await sock.sendMessage(chatId, {
                    text: 'removebg\n\nreply gambar dengan: .removebg'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const targetMsg = quotedMsg ? { message: quotedMsg } : msg;
            const imageBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            const result = await removeBackground(imageBuffer);

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, {
                    image: result,
                    caption: 'background removed'
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal remove background'
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

async function removeBackground(imageBuffer) {
    // API 1: remove.bg
    try {
        const form = new FormData();
        form.append('image_file', imageBuffer, { filename: 'image.png' });
        form.append('size', 'auto');

        const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
            headers: {
                ...form.getHeaders(),
                'X-Api-Key': 'rN95mKJHcVoEHo5twBmxD4P6'
            },
            responseType: 'arraybuffer',
            timeout: 30000
        });

        if (res.data) return Buffer.from(res.data);
    } catch { }

    // API 2: Photoroom
    try {
        const form2 = new FormData();
        form2.append('image_file', imageBuffer, { filename: 'image.png' });

        const res2 = await axios.post('https://sdk.photoroom.com/v1/segment', form2, {
            headers: {
                ...form2.getHeaders(),
                'x-api-key': 'sandbox_31415926535897932384626'
            },
            responseType: 'arraybuffer',
            timeout: 30000
        });

        if (res2.data) return Buffer.from(res2.data);
    } catch { }

    // API 3: Clipdrop
    try {
        const form3 = new FormData();
        form3.append('image_file', imageBuffer, { filename: 'image.png' });

        const res3 = await axios.post('https://clipdrop-api.co/remove-background/v1', form3, {
            headers: {
                ...form3.getHeaders(),
                'x-api-key': '0af0bdc0ca63c3d9f57c92cc5d2f0da4a8e9d6b8c1e0f0a1b2c3d4e5f6a7b8c9'
            },
            responseType: 'arraybuffer',
            timeout: 30000
        });

        if (res3.data) return Buffer.from(res3.data);
    } catch { }

    return null;
}
