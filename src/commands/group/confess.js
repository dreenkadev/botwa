// confess - kirim pesan anonim ke admin grup
module.exports = {
    name: 'confess',
    aliases: ['confession', 'menfess', 'anon'],
    description: 'kirim pesan anonim ke admin',
    groupOnly: true,

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const message = args.join(' ');

            if (!message) {
                await sock.sendMessage(chatId, { text: '*confess*\n\n.confess <pesan rahasia>\npesan akan dikirim ke admin secara anonim' }, { quoted: msg });
                return;
            }

            const groupMeta = await sock.groupMetadata(chatId);
            const groupName = groupMeta.subject;
            const admins = groupMeta.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');

            if (admins.length === 0) {
                await sock.sendMessage(chatId, { text: 'tidak ada admin di grup ini' }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, { text: `confession terkirim ke ${admins.length} admin` }, { quoted: msg });

            try { await sock.sendMessage(chatId, { delete: msg.key }); } catch { }

            const confessId = '#CF' + Date.now().toString(36).toUpperCase();
            const confessText = `*anonymous confession*\n\ndari grup: ${groupName}\nid: ${confessId}\n\n${message}\n\n${new Date().toLocaleString('id-ID')}`;

            for (const admin of admins) {
                try { await sock.sendMessage(admin.id, { text: confessText }); } catch { }
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal mengirim confession' }, { quoted: msg });
        }
    }
};
