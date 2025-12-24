// mirror - dengan reaction
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'mirror',
    aliases: ['flip'],
    description: 'mirror gambar',

    async execute(sock, msg, { chatId, args, mediaMessage, quotedMsg }) {
        try {
            let imageBuffer = null;

            if (mediaMessage?.type === 'image') {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } else if (quotedMsg?.imageMessage) {
                imageBuffer = await downloadMediaMessage({ message: quotedMsg, key: msg.key }, 'buffer', {});
            }

            if (!imageBuffer) {
                await sock.sendMessage(chatId, { text: '*mirror*\n\n.mirror [h/v]' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const direction = args[0]?.toLowerCase() || 'h';
            const result = direction === 'v' ? await sharp(imageBuffer).flip().toBuffer() : await sharp(imageBuffer).flop().toBuffer();

            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { image: result }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
        }
    }
};
