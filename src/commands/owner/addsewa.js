// addsewa - Add or extend rental (owner only)
const { addRental, removeRental, updateSettings } = require('../../utils/rental');

module.exports = {
    name: 'addsewa',
    aliases: ['addrent', 'activatesewa', 'extendsewa'],
    description: 'tambah/perpanjang sewa (owner)',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const action = args[0]?.toLowerCase();

            // Show help
            if (!action) {
                await sock.sendMessage(chatId, {
                    text: `addsewa - kelola sewa\n\n.addsewa <hari> → tambah sewa chat ini\n.addsewa <hari> <chatId> → tambah sewa chat lain\n.addsewa remove → hapus sewa chat ini\n.addsewa remove <chatId> → hapus sewa chat lain\n\ncontoh:\n.addsewa 30 → sewa 30 hari\n.addsewa 7 628xxx@s.whatsapp.net`
                }, { quoted: msg });
                return;
            }

            // Remove rental
            if (action === 'remove' || action === 'delete') {
                const targetChat = args[1] || chatId;
                removeRental(targetChat);
                await sock.sendMessage(chatId, {
                    text: `sewa dihapus untuk: ${targetChat}`
                }, { quoted: msg });
                return;
            }

            // Add/extend rental
            const days = parseInt(action);
            if (isNaN(days) || days <= 0) {
                await sock.sendMessage(chatId, {
                    text: 'jumlah hari tidak valid'
                }, { quoted: msg });
                return;
            }

            const targetChat = args[1] || chatId;
            const info = addRental(targetChat, days, senderId);

            await sock.sendMessage(chatId, {
                text: `sewa ditambahkan\n\nchat: ${targetChat}\ntambah: ${days} hari\ntotal sisa: ${info.daysRemaining} hari\nberakhir: ${info.expiryDate}`
            }, { quoted: msg });

            // Notify target chat if different
            if (targetChat !== chatId) {
                try {
                    await sock.sendMessage(targetChat, {
                        text: `sewa bot diaktifkan!\n\nmasa: ${days} hari\nberakhir: ${info.expiryDate}\n\nterima kasih telah menyewa bot ini.`
                    });
                } catch { }
            }

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};
