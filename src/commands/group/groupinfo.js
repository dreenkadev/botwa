// groupinfo - info lengkap grup
module.exports = {
    name: 'groupinfo',
    aliases: ['ginfo'],
    description: 'info grup',
    groupOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            const meta = await sock.groupMetadata(chatId);
            const owner = meta.owner ? meta.owner.replace('@s.whatsapp.net', '') : 'unknown';
            const admins = meta.participants.filter(p => p.admin).length;
            const members = meta.participants.length;
            const created = meta.creation ? new Date(meta.creation * 1000).toLocaleDateString('id-ID') : 'unknown';

            let text = `*info grup*\n\nnama: ${meta.subject}\nid: ${chatId}\nowner: @${owner}\ndibuat: ${created}\n\nmember: ${members}\nadmin: ${admins}`;

            if (meta.desc) text += `\n\ndeskripsi:\n${meta.desc.substring(0, 150)}`;

            await sock.sendMessage(chatId, { text, mentions: [`${owner}@s.whatsapp.net`] }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal ambil info' }, { quoted: msg });
        }
    }
};
