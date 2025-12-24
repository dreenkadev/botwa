// kick - kick member dari grup
module.exports = {
    name: 'kick',
    aliases: ['remove', 'keluarkan'],
    description: 'kick member dari grup',
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
                await sock.sendMessage(chatId, { text: '*kick*\n\n.kick @user\natau reply pesan user' }, { quoted: msg });
                return;
            }

            await sock.groupParticipantsUpdate(chatId, [targetId], 'remove');
            await sock.sendMessage(chatId, { text: `member @${targetId.split('@')[0]} telah dikick`, mentions: [targetId] }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal kick member' }, { quoted: msg });
        }
    }
};
