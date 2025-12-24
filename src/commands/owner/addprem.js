// addprem - tambah premium user
const { addPremium } = require('../../utils/premium');

module.exports = {
    name: 'addprem',
    aliases: ['addpremium'],
    description: 'tambah premium user',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args, quotedMsg }) {
        try {
            let targetId = null;
            let days = 30;

            if (quotedMsg) {
                targetId = msg.message?.extendedTextMessage?.contextInfo?.participant?.replace('@s.whatsapp.net', '');
                days = parseInt(args[0]) || 30;
            } else {
                const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                if (mentions.length > 0) {
                    targetId = mentions[0].replace('@s.whatsapp.net', '');
                    days = parseInt(args[1]) || parseInt(args[0]) || 30;
                } else if (args[0]) {
                    targetId = args[0].replace('@', '').replace(/\D/g, '');
                    days = parseInt(args[1]) || 30;
                }
            }

            if (!targetId) {
                await sock.sendMessage(chatId, { text: '*addprem*\n\n.addprem @user [hari]\ndefault: 30 hari\npermanent: 0' }, { quoted: msg });
                return;
            }

            addPremium(targetId, days, 'owner');
            const expText = days === 0 ? 'permanent' : `${days} hari`;

            await sock.sendMessage(chatId, { text: `premium ditambahkan\nuser: @${targetId}\ndurasi: ${expText}`, mentions: [`${targetId}@s.whatsapp.net`] }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal tambah premium' }, { quoted: msg });
        }
    }
};
