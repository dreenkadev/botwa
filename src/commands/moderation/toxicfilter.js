// toxicfilter - toggle filter kata toxic
const toxicGroups = new Set();

module.exports = {
    name: 'toxicfilter',
    aliases: ['antitoxic', 'tf'],
    description: 'toggle filter toxic',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            if (action === 'on') {
                toxicGroups.add(chatId);
                await sock.sendMessage(chatId, { text: 'toxic filter aktif' }, { quoted: msg });
            } else if (action === 'off') {
                toxicGroups.delete(chatId);
                await sock.sendMessage(chatId, { text: 'toxic filter nonaktif' }, { quoted: msg });
            } else {
                const status = toxicGroups.has(chatId) ? 'aktif' : 'nonaktif';
                await sock.sendMessage(chatId, { text: `*toxicfilter*\n\nstatus: ${status}\n\n.toxicfilter on/off` }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};

module.exports.isToxicFilter = (chatId) => toxicGroups.has(chatId);
