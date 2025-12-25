// leaderboard - ranking user berdasarkan coins
const { getLeaderboard, formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'top', 'rank'],
    description: 'ranking user dengan coins terbanyak',

    async execute(sock, msg, { chatId, args }) {
        try {
            const limit = parseInt(args[0]) || 10;
            const leaderboard = getLeaderboard(Math.min(limit, 20));

            if (leaderboard.length === 0) {
                await sock.sendMessage(chatId, {
                    text: '*🏆 LEADERBOARD*\n\nBelum ada data. Gunakan .daily untuk mulai mengumpulkan coins!'
                }, { quoted: msg });
                return;
            }

            let text = `*🏆 LEADERBOARD - Top ${leaderboard.length}*\n\n`;
            const mentions = [];
            const medals = ['🥇', '🥈', '🥉'];

            leaderboard.forEach((user, i) => {
                const medal = medals[i] || `${i + 1}.`;
                text += `${medal} @${user.userId} - ${formatCoins(user.coins)} coins\n`;
                mentions.push(`${user.userId}@s.whatsapp.net`);
            });

            text += '\n💡 Gunakan .daily untuk claim reward harian!';

            await sock.sendMessage(chatId, { text, mentions }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: '❌ Gagal memuat leaderboard' }, { quoted: msg });
        }
    }
};
