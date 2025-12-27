// top - Leaderboard XP/Level
const { getLeaderboard } = require('../../utils/leveling');

module.exports = {
    name: 'top',
    aliases: ['leaderboard', 'toplevel', 'topxp'],
    description: 'leaderboard level',

    async execute(sock, msg, { chatId }) {
        try {
            const leaderboard = getLeaderboard(10);

            if (leaderboard.length === 0) {
                await sock.sendMessage(chatId, { text: 'belum ada data' }, { quoted: msg });
                return;
            }

            let text = `top 10 level\n\n`;

            leaderboard.forEach((user, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                const userId = user.id.split('@')[0];
                text += `${medal} ${userId.substring(0, 10)}... - Lv.${user.level} (${user.xp} XP)\n`;
            });

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error: ' + err.message }, { quoted: msg });
        }
    }
};
