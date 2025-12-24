// blur - dengan reaction
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'blur',
    aliases: ['blurimg'],
    description: 'blur gambar',

    async execute(sock, msg, { chatId, args, mediaMessage, quotedMsg }) {
        try {
            let imageBuffer = null;

            if (mediaMessage?.type === 'image') {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } else if (quotedMsg?.imageMessage) {
                imageBuffer = await downloadMediaMessage({ message: quotedMsg, key: msg.key }, 'buffer', {});
            }

            if (!imageBuffer) {
                await sock.sendMessage(chatId, { text: '*blur*\n\n.blur [level]' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const level = parseInt(args[0]) || 10;
            const blurred = await sharp(imageBuffer).blur(Math.min(level, 100)).toBuffer();

            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { image: blurred }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
        }
    }
};
