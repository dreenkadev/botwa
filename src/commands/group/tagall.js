// tagall - tag semua member grup
module.exports = {
    name: 'tagall',
    aliases: ['all', 'everyone'],
    description: 'tag semua member',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const message = args.join(' ') || 'pengumuman';
            const groupMeta = await sock.groupMetadata(chatId);
            const participants = groupMeta.participants;

            let text = `*${message}*\n\n`;
            participants.forEach(p => { text += `@${p.id.split('@')[0]}\n`; });

            await sock.sendMessage(chatId, { text, mentions: participants.map(p => p.id) }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal tagall' }, { quoted: msg });
        }
    }
};
