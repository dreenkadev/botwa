// delprem - hapus premium user
const { removePremium } = require('../../utils/premium');

module.exports = {
    name: 'delprem',
    aliases: ['delpremium'],
    description: 'hapus premium user',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args, quotedMsg }) {
        try {
            let targetId = null;

            if (quotedMsg) {
                targetId = msg.message?.extendedTextMessage?.contextInfo?.participant?.replace('@s.whatsapp.net', '');
            } else {
                const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                if (mentions.length > 0) targetId = mentions[0].replace('@s.whatsapp.net', '');
                else if (args[0]) targetId = args[0].replace('@', '').replace(/\D/g, '');
            }

            if (!targetId) {
                await sock.sendMessage(chatId, { text: '*delprem*\n\n.delprem @user' }, { quoted: msg });
                return;
            }

            const removed = removePremium(targetId);
            await sock.sendMessage(chatId, { text: removed ? `premium dihapus dari @${targetId}` : 'user tidak ditemukan', mentions: [`${targetId}@s.whatsapp.net`] }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal hapus premium' }, { quoted: msg });
        }
    }
};
