// toimg - dengan reaction
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'toimg',
    aliases: ['stickertoimg', 'sti'],
    description: 'sticker ke image',

    async execute(sock, msg, { chatId, mediaMessage, quotedMsg }) {
        try {
            let stickerBuffer = null;

            if (mediaMessage?.type === 'sticker') {
                stickerBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } else if (quotedMsg?.stickerMessage) {
                stickerBuffer = await downloadMediaMessage({ message: quotedMsg, key: msg.key }, 'buffer', {});
            }

            if (!stickerBuffer) {
                await sock.sendMessage(chatId, { text: '*toimg*\n\nreply sticker' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { image: stickerBuffer }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
        }
    }
};
