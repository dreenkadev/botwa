// listadmin - list admin grup
module.exports = {
    name: 'listadmin',
    aliases: ['admins'],
    description: 'list admin grup',
    groupOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            const meta = await sock.groupMetadata(chatId);
            const admins = meta.participants.filter(p => p.admin);

            if (admins.length === 0) {
                await sock.sendMessage(chatId, { text: 'tidak ada admin' }, { quoted: msg });
                return;
            }

            let text = `*admin* (${admins.length})\n\n`;
            const mentions = [];
            admins.forEach((a, i) => {
                const id = a.id.replace('@s.whatsapp.net', '');
                text += `${i + 1}. @${id} ${a.admin === 'superadmin' ? '(owner)' : ''}\n`;
                mentions.push(a.id);
            });

            await sock.sendMessage(chatId, { text, mentions }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal ambil list' }, { quoted: msg });
        }
    }
};
