// note - simpan catatan
const notes = new Map();

module.exports = {
    name: 'note',
    aliases: ['notes', 'catatan'],
    description: 'simpan catatan',

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const action = args[0]?.toLowerCase();

            if (!action || action === 'list') {
                const userNotes = notes.get(senderId) || [];
                if (userNotes.length === 0) {
                    await sock.sendMessage(chatId, { text: '*note*\n\nbelum ada catatan\n\n.note add <catatan>\n.note del <nomor>\n.note list' }, { quoted: msg });
                    return;
                }
                let text = '*catatan*\n\n';
                userNotes.forEach((n, i) => { text += `${i + 1}. ${n}\n`; });
                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            if (action === 'add') {
                const content = args.slice(1).join(' ');
                if (!content) { await sock.sendMessage(chatId, { text: '.note add <catatan>' }, { quoted: msg }); return; }
                const userNotes = notes.get(senderId) || [];
                userNotes.push(content);
                notes.set(senderId, userNotes);
                await sock.sendMessage(chatId, { text: 'catatan ditambahkan' }, { quoted: msg });
                return;
            }

            if (action === 'del') {
                const num = parseInt(args[1]);
                const userNotes = notes.get(senderId) || [];
                if (!num || num < 1 || num > userNotes.length) { await sock.sendMessage(chatId, { text: 'nomor tidak valid' }, { quoted: msg }); return; }
                userNotes.splice(num - 1, 1);
                notes.set(senderId, userNotes);
                await sock.sendMessage(chatId, { text: 'catatan dihapus' }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
