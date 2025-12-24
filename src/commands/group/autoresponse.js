// autoresponse - auto reply keyword
const { setAutoResponse, getAllAutoResponses, deleteAutoResponse } = require('../../utils/groupManager');

module.exports = {
    name: 'autoresponse',
    aliases: ['ar'],
    description: 'auto reply keyword',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            if (!action || action === 'list') {
                const responses = getAllAutoResponses(chatId);
                if (responses.length === 0) {
                    await sock.sendMessage(chatId, { text: '*autoresponse*\n\nbelum ada\n\n.ar add <trigger> | <response>\n.ar del <trigger>\n.ar list' }, { quoted: msg });
                    return;
                }
                let text = `*autoresponse* (${responses.length})\n\n`;
                responses.forEach((r, i) => { text += `${i + 1}. "${r.trigger}" -> "${r.response.substring(0, 20)}..."\n`; });
                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            if (action === 'add') {
                const content = args.slice(1).join(' ');
                const parts = content.split('|').map(p => p.trim());
                if (parts.length < 2 || !parts[0] || !parts[1]) {
                    await sock.sendMessage(chatId, { text: '.ar add <trigger> | <response>' }, { quoted: msg });
                    return;
                }
                setAutoResponse(chatId, parts[0], parts[1]);
                await sock.sendMessage(chatId, { text: `ditambahkan: "${parts[0]}" -> "${parts[1]}"` }, { quoted: msg });
                return;
            }

            if (action === 'del') {
                const trigger = args.slice(1).join(' ');
                if (!trigger) { await sock.sendMessage(chatId, { text: '.ar del <trigger>' }, { quoted: msg }); return; }
                const deleted = deleteAutoResponse(chatId, trigger);
                await sock.sendMessage(chatId, { text: deleted ? 'dihapus' : 'tidak ditemukan' }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
