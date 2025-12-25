// masa - Check remaining rental time
const { getRentalInfo, formatExpiryMessage } = require('../../utils/rental');
const config = require('../../../config');

module.exports = {
    name: 'masa',
    aliases: ['expire', 'remaining', 'sisasewa'],
    description: 'cek sisa masa sewa bot',

    async execute(sock, msg, { chatId, senderId }) {
        try {
            const isOwner = senderId === config.ownerNumber;
            const info = getRentalInfo(chatId);

            if (!info) {
                await sock.sendMessage(chatId, {
                    text: 'chat ini belum terdaftar sewa.\n\nketik .sewa untuk melihat harga.'
                }, { quoted: msg });
                return;
            }

            if (!info.isActive) {
                const msg = formatExpiryMessage(0, true);
                await sock.sendMessage(chatId, { text: msg }, { quoted: msg });
                return;
            }

            let text = `status sewa\n\n`;
            text += `sisa: ${info.daysRemaining} hari\n`;
            text += `berakhir: ${info.expiryDate}\n`;

            if (isOwner) {
                text += `\nadded by: ${info.addedBy || 'owner'}`;
            }

            if (info.daysRemaining <= 7) {
                text += `\n\n⚠️ segera perpanjang agar tidak terputus!`;
            }

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};
