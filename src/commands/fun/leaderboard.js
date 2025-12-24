// leaderboard - ranking user aktif
const { getLeaderboard } = require('../../utils/groupManager');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'top', 'rank'],
    description: 'ranking user aktif',

    async execute(sock, msg, { chatId, args }) {
        try {
            const limit = parseInt(args[0]) || 10;
            const leaderboard = getLeaderboard(Math.min(limit, 20));

            if (leaderboard.length === 0) {
                await sock.sendMessage(chatId, { text: 'belum ada data aktivitas' }, { quoted: msg });
                return;
            }

            let text = `*leaderboard - top ${leaderboard.length}*\n\n`;
            const mentions = [];

            leaderboard.forEach((user, i) => {
                const medal = i === 0 ? '1.' : i === 1 ? '2.' : i === 2 ? '3.' : `${i + 1}.`;
                text += `${medal} @${user.userId} - ${user.messages} msg\n`;
                mentions.push(`${user.userId}@s.whatsapp.net`);
            });

            await sock.sendMessage(chatId, { text, mentions }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal memuat leaderboard' }, { quoted: msg });
        }
    }
};
