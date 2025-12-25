// listsewa - List all rentals (owner only)
const { getAllRentals } = require('../../utils/rental');

module.exports = {
    name: 'listsewa',
    aliases: ['listrent', 'sewalist', 'rentlist'],
    description: 'lihat semua sewa aktif (owner)',
    ownerOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            const rentals = getAllRentals();

            if (rentals.length === 0) {
                await sock.sendMessage(chatId, {
                    text: 'tidak ada sewa aktif'
                }, { quoted: msg });
                return;
            }

            const active = rentals.filter(r => r.isActive);
            const expired = rentals.filter(r => !r.isActive);

            let text = `daftar sewa\n\n`;

            if (active.length > 0) {
                text += `AKTIF (${active.length}):\n`;
                active.forEach((r, i) => {
                    const chatName = r.chatId.includes('@g.us') ? 'grup' : 'private';
                    const shortId = r.chatId.split('@')[0].slice(-6);
                    text += `${i + 1}. [${chatName}] ...${shortId}\n`;
                    text += `   sisa: ${r.daysRemaining} hari\n`;
                    text += `   exp: ${new Date(r.expiry).toLocaleDateString('id-ID')}\n\n`;
                });
            }

            if (expired.length > 0) {
                text += `\nKADALUARSA (${expired.length}):\n`;
                expired.forEach((r, i) => {
                    const chatName = r.chatId.includes('@g.us') ? 'grup' : 'private';
                    const shortId = r.chatId.split('@')[0].slice(-6);
                    text += `${i + 1}. [${chatName}] ...${shortId}\n`;
                });
            }

            text += `\ntotal: ${rentals.length} chat`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};
