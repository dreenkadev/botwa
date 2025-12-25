// addtoxic - Add/remove toxic words (owner only)
const { addToxicWord, removeToxicWord, getCustomWords, getAllToxicWords } = require('../../services/moderationService');

module.exports = {
    name: 'addtoxic',
    aliases: ['deltoxic', 'listtoxic', 'toxicword'],
    description: 'kelola kata toxic filter',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            // List all words
            if (!action || action === 'list') {
                const custom = getCustomWords();
                const all = getAllToxicWords();

                let text = `toxic words (${all.length} total)\n\n`;
                text += `default: ${all.length - custom.length}\n`;
                text += `custom: ${custom.length}\n\n`;

                if (custom.length > 0) {
                    text += `custom words:\n${custom.join(', ')}\n\n`;
                }

                text += `commands:\n.addtoxic add <kata>\n.addtoxic remove <kata>`;

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // Add word
            if (action === 'add') {
                const word = args.slice(1).join(' ').toLowerCase().trim();

                if (!word) {
                    await sock.sendMessage(chatId, {
                        text: 'masukkan kata yang mau ditambah\ncontoh: .addtoxic add katakotor'
                    }, { quoted: msg });
                    return;
                }

                const added = addToxicWord(word);

                if (added) {
                    await sock.sendMessage(chatId, {
                        text: `kata "${word}" ditambahkan ke toxic filter`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `kata "${word}" sudah ada di filter`
                    }, { quoted: msg });
                }
                return;
            }

            // Remove word
            if (action === 'remove' || action === 'delete' || action === 'del') {
                const word = args.slice(1).join(' ').toLowerCase().trim();

                if (!word) {
                    await sock.sendMessage(chatId, {
                        text: 'masukkan kata yang mau dihapus\ncontoh: .addtoxic remove katakotor'
                    }, { quoted: msg });
                    return;
                }

                const removed = removeToxicWord(word);

                if (removed) {
                    await sock.sendMessage(chatId, {
                        text: `kata "${word}" dihapus dari toxic filter`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `kata "${word}" tidak ditemukan di custom words (default words tidak bisa dihapus)`
                    }, { quoted: msg });
                }
                return;
            }

            await sock.sendMessage(chatId, {
                text: 'action tidak dikenal. ketik .addtoxic untuk bantuan'
            }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};
