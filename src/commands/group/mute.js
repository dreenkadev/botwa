// mute - mute grup (hanya admin bisa chat)
module.exports = {
    name: 'mute',
    aliases: ['close'],
    description: 'mute grup',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.sendMessage(chatId, { text: 'grup dimute, hanya admin yang bisa chat' }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal mute grup' }, { quoted: msg });
        }
    }
};
