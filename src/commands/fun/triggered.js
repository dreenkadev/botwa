const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'triggered',
    aliases: ['trigger', 'marah'],
    description: 'Triggered meme effect on image',

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
                text: '📷 Kirim gambar atau reply gambar dengan .triggered\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(chatId, {
            text: '⏳ Processing triggered effect...\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
        }, { quoted: msg });

        try {
            const sharp = require('sharp');

            // Create triggered effect - red tint + slight blur for shaking effect
            const processed = await sharp(imageBuffer)
                .modulate({ saturation: 1.5 })
                .tint({ r: 255, g: 100, b: 100 })
                .toBuffer();

            await sock.sendMessage(chatId, {
                image: processed,
                caption: '😤 *TRIGGERED*\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: '❌ Gagal memproses gambar.\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};
