// transfer - transfer coins ke user
const { transferCoins, getBalance, formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'transfer',
    aliases: ['tf', 'pay'],
    description: 'transfer coins',

    async execute(sock, msg, { chatId, args, senderId, quotedMsg }) {
        try {
            let targetId = null;
            let amount = 0;

            if (quotedMsg) {
                targetId = msg.message?.extendedTextMessage?.contextInfo?.participant?.replace('@s.whatsapp.net', '');
                amount = parseInt(args[0]);
            } else {
                const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                if (mentions.length > 0) {
                    targetId = mentions[0].replace('@s.whatsapp.net', '');
                    amount = parseInt(args[1]) || parseInt(args[0]);
                }
            }

            if (!targetId || !amount || amount <= 0) {
                await sock.sendMessage(chatId, { text: '*transfer*\n\n.tf @user <jumlah>' }, { quoted: msg });
                return;
            }

            if (targetId === senderId) {
                await sock.sendMessage(chatId, { text: 'tidak bisa transfer ke diri sendiri' }, { quoted: msg });
                return;
            }

            const senderBal = getBalance(senderId);
            if (senderBal.coins < amount) {
                await sock.sendMessage(chatId, { text: `saldo tidak cukup\nsaldo: ${formatCoins(senderBal.coins)}` }, { quoted: msg });
                return;
            }

            const success = transferCoins(senderId, targetId, amount);
            if (success) {
                const newBal = getBalance(senderId);
                await sock.sendMessage(chatId, { text: `transfer berhasil\n-${formatCoins(amount)} ke @${targetId}\nsisa: ${formatCoins(newBal.coins)}`, mentions: [`${targetId}@s.whatsapp.net`] }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'transfer gagal' }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
