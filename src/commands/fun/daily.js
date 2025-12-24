// daily reward - klaim coins harian
const { claimDaily, getBalance, formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'daily',
    aliases: ['claim', 'reward'],
    description: 'klaim reward harian',

    async execute(sock, msg, { chatId, senderId }) {
        try {
            const result = claimDaily(senderId);

            if (!result.success) {
                const hours = Math.floor(result.remaining / 3600000);
                const mins = Math.floor((result.remaining % 3600000) / 60000);

                await sock.sendMessage(chatId, {
                    text: `sudah klaim hari ini\nklaim lagi dalam ${hours}j ${mins}m`
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                text: `*daily reward*\n\n+${formatCoins(result.reward)} coins\nsaldo: ${formatCoins(result.newBalance)}\n\nklaim lagi besok`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error: ' + (err.message || 'unknown') }, { quoted: msg });
        }
    }
};
