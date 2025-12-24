// pixelate - dengan reaction
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'pixelate',
    aliases: ['pixel'],
    description: 'pixelate gambar',

    async execute(sock, msg, { chatId, args, mediaMessage, quotedMsg }) {
        try {
            let imageBuffer = null;

            if (mediaMessage?.type === 'image') {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } else if (quotedMsg?.imageMessage) {
                imageBuffer = await downloadMediaMessage({ message: quotedMsg, key: msg.key }, 'buffer', {});
            }

            if (!imageBuffer) {
                await sock.sendMessage(chatId, { text: '*pixelate*\n\n.pixel [level]' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const level = Math.min(Math.max(parseInt(args[0]) || 10, 1), 100);
            const metadata = await sharp(imageBuffer).metadata();
            const blockSize = Math.max(Math.floor(Math.min(metadata.width, metadata.height) / (100 - level + 1)), 2);
            const result = await sharp(imageBuffer)
                .resize(Math.floor(metadata.width / blockSize), Math.floor(metadata.height / blockSize), { kernel: 'nearest' })
                .resize(metadata.width, metadata.height, { kernel: 'nearest' })
                .toBuffer();

            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { image: result }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
        }
    }
};
