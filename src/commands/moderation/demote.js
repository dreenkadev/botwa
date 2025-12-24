// demote - hapus admin
module.exports = {
    name: 'demote',
    aliases: ['unadmin'],
    description: 'hapus admin',
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
                await sock.sendMessage(chatId, { text: '*demote*\n\n.demote @user' }, { quoted: msg });
                return;
            }

            await sock.groupParticipantsUpdate(chatId, [targetId], 'demote');
            await sock.sendMessage(chatId, { text: `@${targetId.split('@')[0]} bukan admin lagi`, mentions: [targetId] }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal demote member' }, { quoted: msg });
        }
    }
};
