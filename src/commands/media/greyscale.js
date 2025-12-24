// greyscale - dengan reaction
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'greyscale',
    aliases: ['grayscale', 'bw'],
    description: 'grayscale gambar',

    async execute(sock, msg, { chatId, mediaMessage, quotedMsg }) {
        try {
            let imageBuffer = null;

            if (mediaMessage?.type === 'image') {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } else if (quotedMsg?.imageMessage) {
                imageBuffer = await downloadMediaMessage({ message: quotedMsg, key: msg.key }, 'buffer', {});
            }

            if (!imageBuffer) {
                await sock.sendMessage(chatId, { text: '*greyscale*\n\nreply gambar' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            const result = await sharp(imageBuffer).greyscale().toBuffer();
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { image: result }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
        }
    }
};
