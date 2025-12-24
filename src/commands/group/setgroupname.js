// setgroupname - set nama grup
module.exports = {
    name: 'setgroupname',
    aliases: ['setname', 'rename'],
    description: 'set nama grup',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const name = args.join(' ');

            if (!name) {
                await sock.sendMessage(chatId, { text: '*setname*\n\n.setname <nama baru>' }, { quoted: msg });
                return;
            }

            await sock.groupUpdateSubject(chatId, name);
            await sock.sendMessage(chatId, { text: 'nama grup diupdate' }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal update nama grup' }, { quoted: msg });
        }
    }
};
