const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'wasted',
    aliases: ['gta', 'mati'],
    description: 'GTA Wasted effect on image',

    async execute(sock, msg, { chatId, quotedMsg, mediaMessage }) {
        let imageBuffer = null;

        // Check if there's a media message
        if (mediaMessage?.type === 'image') {
            try {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } catch { }
        }

        // Check quoted message for image
        if (!imageBuffer && quotedMsg?.imageMessage) {
            try {
                const quotedMedia = {
                    message: { imageMessage: quotedMsg.imageMessage },
                    key: msg.key
                };
                imageBuffer = await downloadMediaMessage(quotedMedia, 'buffer', {});
            } catch { }
        }

        if (!imageBuffer) {
            await sock.sendMessage(chatId, {
                text: '📷 Kirim gambar atau reply gambar dengan .wasted\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(chatId, {
            text: '⏳ Processing wasted effect...\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
        }, { quoted: msg });

        try {
            // Using some-random-api for wasted effect
            const response = await axios.post(
                'https://some-random-api.com/canvas/misc/wasted',
                imageBuffer,
                {
                    headers: { 'Content-Type': 'image/png' },
                    responseType: 'arraybuffer',
                    timeout: 30000
                }
            );

            await sock.sendMessage(chatId, {
                image: Buffer.from(response.data),
                caption: '💀 *WASTED*\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });

        } catch {
            // Fallback - just send with text overlay simulation
            try {
                const sharp = require('sharp');

                // Create a simple grayscale + red tint effect
                const processed = await sharp(imageBuffer)
                    .grayscale()
                    .tint({ r: 139, g: 0, b: 0 })
                    .toBuffer();

                await sock.sendMessage(chatId, {
                    image: processed,
                    caption: '💀 *WASTED*\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
            } catch (err) {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal memproses gambar.\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
            }
        }
    }
};
