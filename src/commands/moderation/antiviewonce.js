// antiviewonce - toggle anti view once
const avoGroups = new Set();

module.exports = {
    name: 'antiviewonce',
    aliases: ['avo'],
    description: 'toggle anti view once',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            if (action === 'on') {
                avoGroups.add(chatId);
                await sock.sendMessage(chatId, { text: 'anti viewonce aktif' }, { quoted: msg });
            } else if (action === 'off') {
                avoGroups.delete(chatId);
                await sock.sendMessage(chatId, { text: 'anti viewonce nonaktif' }, { quoted: msg });
            } else {
                const status = avoGroups.has(chatId) ? 'aktif' : 'nonaktif';
                await sock.sendMessage(chatId, { text: `*antiviewonce*\n\nstatus: ${status}\n\n.avo on/off` }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};

module.exports.isAntiViewOnce = (chatId) => avoGroups.has(chatId);
