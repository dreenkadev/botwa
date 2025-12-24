// revoke - revoke link grup
module.exports = {
    name: 'revoke',
    aliases: ['resetlink'],
    description: 'revoke link grup',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            const code = await sock.groupRevokeInvite(chatId);
            await sock.sendMessage(chatId, { text: `link direset\nlink baru: https://chat.whatsapp.com/${code}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal revoke link' }, { quoted: msg });
        }
    }
};
