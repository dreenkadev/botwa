// hidetag - tag all tanpa visible mention
module.exports = {
    name: 'hidetag',
    aliases: ['hd', 'tagall2'],
    description: 'tag all tanpa visible mention',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const message = args.join(' ') || 'pengumuman';

            const groupMeta = await sock.groupMetadata(chatId);
            const participants = groupMeta.participants.map(p => p.id);

            await sock.sendMessage(chatId, { text: message, mentions: participants });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal mengirim hidetag' }, { quoted: msg });
        }
    }
};
