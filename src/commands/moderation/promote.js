// promote - jadikan admin
module.exports = {
    name: 'promote',
    aliases: ['admin'],
    description: 'jadikan admin',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, quotedMsg }) {
        try {
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let targetId = mentions[0];

            if (!targetId && quotedMsg) {
                targetId = msg.message?.extendedTextMessage?.contextInfo?.participant;
            }

            if (!targetId) {
                await sock.sendMessage(chatId, { text: '*promote*\n\n.promote @user' }, { quoted: msg });
                return;
            }

            await sock.groupParticipantsUpdate(chatId, [targetId], 'promote');
            await sock.sendMessage(chatId, { text: `@${targetId.split('@')[0]} sekarang admin`, mentions: [targetId] }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal promote member' }, { quoted: msg });
        }
    }
};
