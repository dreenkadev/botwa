// unmute - unmute grup
module.exports = {
    name: 'unmute',
    aliases: ['open'],
    description: 'unmute grup',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            await sock.groupSettingUpdate(chatId, 'not_announcement');
            await sock.sendMessage(chatId, { text: 'grup diunmute, semua bisa chat' }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal unmute grup' }, { quoted: msg });
        }
    }
};
