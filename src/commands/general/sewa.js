// sewa - Show price list for bot rental
const { getPriceList, getPaymentInfo } = require('../../utils/rental');
const config = require('../../../config');

module.exports = {
    name: 'sewa',
    aliases: ['rent', 'price', 'harga'],
    description: 'lihat harga sewa bot',

    async execute(sock, msg, { chatId }) {
        try {
            const prices = getPriceList();
            const payment = getPaymentInfo();

            let text = `HARGA SEWA BOT\n\n`;

            prices.forEach(p => {
                text += `📦 ${p.label}\n`;
                text += `   Rp ${p.price.toLocaleString('id-ID')}\n\n`;
            });

            text += `━━━━━━━━━━━━━━━\n`;
            text += `💳 PEMBAYARAN\n\n`;

            text += `🏦 Bank ${payment.bank}\n`;
            text += `   ${payment.accountNumber}\n`;
            text += `   a.n ${payment.accountName}\n\n`;

            text += `📱 E-Wallet:\n`;
            if (payment.ewallet.dana) text += `   DANA: ${payment.ewallet.dana}\n`;
            if (payment.ewallet.gopay) text += `   GoPay: ${payment.ewallet.gopay}\n`;
            if (payment.ewallet.ovo) text += `   OVO: ${payment.ewallet.ovo}\n`;

            text += `\n━━━━━━━━━━━━━━━\n`;
            text += `📞 hubungi owner:\n`;
            text += `   wa.me/${config.ownerNumber}\n\n`;
            text += `kirim bukti transfer ke owner untuk aktivasi.`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};
