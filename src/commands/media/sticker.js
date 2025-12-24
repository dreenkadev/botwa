// sticker - dengan reaction
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'sticker',
    aliases: ['s', 'stiker'],
    description: 'convert gambar ke sticker',

    async execute(sock, msg, { chatId, mediaMessage, quotedMsg }) {
        try {
            let imageBuffer = null;

            if (mediaMessage?.type === 'image') {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } else if (quotedMsg?.imageMessage) {
                imageBuffer = await downloadMediaMessage({ message: quotedMsg, key: msg.key }, 'buffer', {});
            }

            if (!imageBuffer) {
                await sock.sendMessage(chatId, { text: '*sticker*\n\nkirim gambar dengan caption .s' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const stickerBuffer = await sharp(imageBuffer)
                .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .webp({ quality: 80 })
                .toBuffer();

            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
        }
    }
};
