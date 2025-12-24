// listprem - list premium users
const { getAllPremium } = require('../../utils/premium');

module.exports = {
    name: 'listprem',
    aliases: ['listpremium', 'prems'],
    description: 'list premium users',
    ownerOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            const users = getAllPremium();

            if (users.length === 0) {
                await sock.sendMessage(chatId, { text: 'tidak ada premium user' }, { quoted: msg });
                return;
            }

            let text = `*premium users* (${users.length})\n\n`;
            const mentions = [];
            users.forEach((u, i) => {
                const exp = u.expiry ? new Date(u.expiry).toLocaleDateString('id-ID') : 'permanent';
                text += `${i + 1}. @${u.userId} (${exp})\n`;
                mentions.push(`${u.userId}@s.whatsapp.net`);
            });

            await sock.sendMessage(chatId, { text, mentions }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal ambil list' }, { quoted: msg });
        }
    }
};
