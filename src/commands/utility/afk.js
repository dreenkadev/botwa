// afk - set status afk
const { setAfk, getAfk, removeAfk, formatAfkDuration } = require('../../utils/afk');

module.exports = {
    name: 'afk',
    aliases: ['away'],
    description: 'set status afk',

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const reason = args.length > 0 ? args.join(' ') : 'afk';

            const existing = getAfk(senderId);
            if (existing) {
                await sock.sendMessage(chatId, { text: `kamu sudah afk\nalasan: ${existing.reason}\nsejak: ${formatAfkDuration(existing.since)}` }, { quoted: msg });
                return;
            }

            setAfk(senderId, reason);
            await sock.sendMessage(chatId, { text: `*afk aktif*\nalasan: ${reason}\n\nafk akan nonaktif saat kamu kirim pesan` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal set afk' }, { quoted: msg });
        }
    }
};
