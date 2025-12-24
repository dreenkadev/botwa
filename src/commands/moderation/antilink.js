// antilink - toggle antilink di grup
const antilinkGroups = new Set();

module.exports = {
    name: 'antilink',
    aliases: ['al'],
    description: 'toggle antilink',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            if (action === 'on') {
                antilinkGroups.add(chatId);
                await sock.sendMessage(chatId, { text: 'antilink aktif' }, { quoted: msg });
            } else if (action === 'off') {
                antilinkGroups.delete(chatId);
                await sock.sendMessage(chatId, { text: 'antilink nonaktif' }, { quoted: msg });
            } else {
                const status = antilinkGroups.has(chatId) ? 'aktif' : 'nonaktif';
                await sock.sendMessage(chatId, { text: `*antilink*\n\nstatus: ${status}\n\n.antilink on/off` }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};

module.exports.isAntilink = (chatId) => antilinkGroups.has(chatId);
