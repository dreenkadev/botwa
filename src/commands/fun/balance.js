// balance - cek saldo coins
const { getBalance, formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'balance',
    aliases: ['bal', 'saldo', 'coins'],
    description: 'cek saldo coins',

    async execute(sock, msg, { chatId, senderId }) {
        try {
            const user = getBalance(senderId);

            await sock.sendMessage(chatId, {
                text: `*saldo*\n\ncoins: ${formatCoins(user.coins)}\ntotal earned: ${formatCoins(user.totalEarned)}\n\ngunakan .daily untuk klaim harian`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error: ' + (err.message || 'unknown') }, { quoted: msg });
        }
    }
};
