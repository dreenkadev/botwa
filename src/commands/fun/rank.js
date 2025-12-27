// rank - Lihat level dan XP
const { getUserData, getXpForNextLevel, getRank } = require('../../utils/leveling');

module.exports = {
    name: 'rank',
    aliases: ['level', 'xp', 'exp'],
    description: 'lihat level dan xp kamu',

    async execute(sock, msg, { chatId, senderId, args }) {
        try {
            // Check target user (mention or self)
            let targetId = senderId;
            if (args[0]?.startsWith('@')) {
                targetId = args[0].replace('@', '') + '@s.whatsapp.net';
            }

            const data = getUserData(targetId);
            const nextLevelXp = getXpForNextLevel(data.level);
            const rank = getRank(targetId);

            const progress = nextLevelXp
                ? Math.floor((data.xp / nextLevelXp) * 100)
                : 100;

            const progressBar = generateProgressBar(progress);

            let text = `rank info\n\n`;
            text += `level: ${data.level}\n`;
            text += `xp: ${data.xp}${nextLevelXp ? '/' + nextLevelXp : ' (max)'}\n`;
            text += `${progressBar} ${progress}%\n`;
            text += `rank: #${rank || '?'}\n`;
            text += `total pesan: ${data.totalMessages}`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error: ' + err.message }, { quoted: msg });
        }
    }
};

function generateProgressBar(percent, length = 10) {
    const filled = Math.round(percent / (100 / length));
    const empty = length - filled;
    return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}
