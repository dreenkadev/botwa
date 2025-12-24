// linkgroup - get link invite grup
module.exports = {
    name: 'linkgroup',
    aliases: ['link', 'invite'],
    description: 'get link grup',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            const code = await sock.groupInviteCode(chatId);
            await sock.sendMessage(chatId, { text: `link grup:\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal ambil link' }, { quoted: msg });
        }
    }
};
