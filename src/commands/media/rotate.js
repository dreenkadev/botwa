// rotate - dengan reaction
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'rotate',
    aliases: ['rot'],
    description: 'rotate gambar',

    async execute(sock, msg, { chatId, args, mediaMessage, quotedMsg }) {
        try {
            let imageBuffer = null;

            if (mediaMessage?.type === 'image') {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } else if (quotedMsg?.imageMessage) {
                imageBuffer = await downloadMediaMessage({ message: quotedMsg, key: msg.key }, 'buffer', {});
            }

            if (!imageBuffer) {
                await sock.sendMessage(chatId, { text: '*rotate*\n\n.rotate <derajat>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const angle = parseInt(args[0]) || 90;
            const result = await sharp(imageBuffer).rotate(angle).toBuffer();

            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { image: result }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
        }
    }
};
