// rules - set/lihat rules grup
const { setRules, getRules, deleteRules } = require('../../utils/groupManager');

module.exports = {
    name: 'rules',
    aliases: ['rule'],
    description: 'set/lihat rules',
    groupOnly: true,

    async execute(sock, msg, { chatId, args, isAdmin }) {
        try {
            const action = args[0]?.toLowerCase();

            if (!action || action === 'view') {
                const rules = getRules(chatId);
                if (!rules) {
                    await sock.sendMessage(chatId, { text: 'belum ada rules\n\nadmin: .rules set <rules>' }, { quoted: msg });
                    return;
                }
                await sock.sendMessage(chatId, { text: `*rules*\n\n${rules}` }, { quoted: msg });
                return;
            }

            if (!isAdmin) {
                await sock.sendMessage(chatId, { text: 'hanya admin' }, { quoted: msg });
                return;
            }

            if (action === 'set') {
                const newRules = args.slice(1).join(' ');
                if (!newRules) { await sock.sendMessage(chatId, { text: '.rules set <rules>' }, { quoted: msg }); return; }
                setRules(chatId, newRules);
                await sock.sendMessage(chatId, { text: 'rules diset' }, { quoted: msg });
                return;
            }

            if (action === 'del') {
                deleteRules(chatId);
                await sock.sendMessage(chatId, { text: 'rules dihapus' }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
