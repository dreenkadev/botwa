// antispam - toggle antispam di grup
const antispamGroups = new Set();

module.exports = {
    name: 'antispam',
    aliases: ['as'],
    description: 'toggle antispam',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            if (action === 'on') {
                antispamGroups.add(chatId);
                await sock.sendMessage(chatId, { text: 'antispam aktif' }, { quoted: msg });
            } else if (action === 'off') {
                antispamGroups.delete(chatId);
                await sock.sendMessage(chatId, { text: 'antispam nonaktif' }, { quoted: msg });
            } else {
                const status = antispamGroups.has(chatId) ? 'aktif' : 'nonaktif';
                await sock.sendMessage(chatId, { text: `*antispam*\n\nstatus: ${status}\n\n.antispam on/off` }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};

module.exports.isAntispam = (chatId) => antispamGroups.has(chatId);
