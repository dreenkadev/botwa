// setgroupdesc - set deskripsi grup
module.exports = {
    name: 'setgroupdesc',
    aliases: ['setdesc', 'desc'],
    description: 'set deskripsi grup',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const desc = args.join(' ');

            if (!desc) {
                await sock.sendMessage(chatId, { text: '*setdesc*\n\n.setdesc <deskripsi baru>' }, { quoted: msg });
                return;
            }

            await sock.groupUpdateDescription(chatId, desc);
            await sock.sendMessage(chatId, { text: 'deskripsi grup diupdate' }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal update deskripsi' }, { quoted: msg });
        }
    }
};
