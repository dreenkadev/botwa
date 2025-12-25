// setsewa - Configure rental settings (owner only)
const { updateSettings, getPriceList, getPaymentInfo } = require('../../utils/rental');

module.exports = {
    name: 'setsewa',
    aliases: ['configsewa', 'sewaconfig'],
    description: 'atur konfigurasi sewa (owner)',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            if (!action) {
                const prices = getPriceList();
                const payment = getPaymentInfo();

                let text = `setsewa - konfigurasi\n\nPRICE LIST:\n`;
                prices.forEach(p => {
                    text += `• ${p.label}: Rp ${p.price.toLocaleString('id-ID')}\n`;
                });

                text += `\nPAYMENT:\n`;
                text += `Bank: ${payment.bank} - ${payment.accountNumber}\n`;
                text += `DANA: ${payment.ewallet.dana}\n`;

                text += `\n─────────────────\n`;
                text += `.setsewa bank <nama> <norek> <atas_nama>\n`;
                text += `.setsewa dana <nomor>\n`;
                text += `.setsewa gopay <nomor>\n`;
                text += `.setsewa ovo <nomor>\n`;
                text += `.setsewa price <hari> <harga> <label>\n\n`;
                text += `contoh:\n.setsewa bank BCA 1234567890 John\n.setsewa dana 081234567890`;

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // Update bank
            if (action === 'bank') {
                const bankName = args[1]?.toUpperCase();
                const accountNumber = args[2];
                const accountName = args.slice(3).join(' ');

                if (!bankName || !accountNumber || !accountName) {
                    await sock.sendMessage(chatId, {
                        text: 'format: .setsewa bank <nama> <norek> <atas_nama>'
                    }, { quoted: msg });
                    return;
                }

                const payment = getPaymentInfo();
                payment.bank = bankName;
                payment.accountNumber = accountNumber;
                payment.accountName = accountName;
                updateSettings({ paymentInfo: payment });

                await sock.sendMessage(chatId, {
                    text: `bank updated:\n${bankName} - ${accountNumber}\na.n ${accountName}`
                }, { quoted: msg });
                return;
            }

            // Update e-wallet
            if (['dana', 'gopay', 'ovo'].includes(action)) {
                const number = args[1];
                if (!number) {
                    await sock.sendMessage(chatId, {
                        text: `format: .setsewa ${action} <nomor>`
                    }, { quoted: msg });
                    return;
                }

                const payment = getPaymentInfo();
                payment.ewallet[action] = number;
                updateSettings({ paymentInfo: payment });

                await sock.sendMessage(chatId, {
                    text: `${action.toUpperCase()} updated: ${number}`
                }, { quoted: msg });
                return;
            }

            // Update price
            if (action === 'price') {
                const days = parseInt(args[1]);
                const price = parseInt(args[2]);
                const label = args.slice(3).join(' ');

                if (!days || !price || !label) {
                    await sock.sendMessage(chatId, {
                        text: 'format: .setsewa price <hari> <harga> <label>\ncontoh: .setsewa price 7 15000 1 Minggu'
                    }, { quoted: msg });
                    return;
                }

                const prices = getPriceList();
                const existing = prices.findIndex(p => p.days === days);

                if (existing >= 0) {
                    prices[existing] = { days, price, label };
                } else {
                    prices.push({ days, price, label });
                    prices.sort((a, b) => a.days - b.days);
                }

                updateSettings({ priceList: prices });

                await sock.sendMessage(chatId, {
                    text: `price updated:\n${label} (${days} hari): Rp ${price.toLocaleString('id-ID')}`
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                text: 'action tidak dikenal. ketik .setsewa untuk bantuan.'
            }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};
