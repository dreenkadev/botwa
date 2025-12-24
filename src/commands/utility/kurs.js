const axios = require('axios');

module.exports = {
    name: 'kurs',
    aliases: ['currency', 'exchange', 'rate'],
    description: 'Check currency exchange rates',

    async execute(sock, msg, { chatId, args }) {
        const amount = parseFloat(args[0]) || 1;
        const from = (args[1] || 'usd').toUpperCase();
        const to = (args[2] || 'idr').toUpperCase();

        if (args.length === 0) {
            await sock.sendMessage(chatId, {
                text: '💱 *Currency Exchange*\n\nUsage: .kurs [amount] <from> <to>\n\nContoh:\n.kurs → USD ke IDR\n.kurs 100 usd idr\n.kurs 50 eur usd\n\nMata uang: USD, IDR, EUR, GBP, JPY, SGD, MYR, dll\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            // If only one arg, treat as from currency
            let fromCurrency = from;
            let toCurrency = to;
            let convertAmount = amount;

            if (args.length === 1 && isNaN(args[0])) {
                fromCurrency = args[0].toUpperCase();
                toCurrency = 'IDR';
                convertAmount = 1;
            }

            const response = await axios.get(
                `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
                { timeout: 10000 }
            );

            const rate = response.data.rates[toCurrency];

            if (!rate) {
                await sock.sendMessage(chatId, {
                    text: `❌ Mata uang ${toCurrency} tidak ditemukan!\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
                return;
            }

            const result = convertAmount * rate;
            const formattedResult = result.toLocaleString('id-ID', { maximumFractionDigits: 2 });
            const formattedAmount = convertAmount.toLocaleString('id-ID');

            // Get common rates
            const commonRates = ['IDR', 'USD', 'EUR', 'GBP', 'SGD', 'MYR', 'JPY']
                .filter(c => c !== fromCurrency)
                .slice(0, 5);

            let ratesText = '';
            for (const cur of commonRates) {
                if (response.data.rates[cur]) {
                    const r = response.data.rates[cur].toLocaleString('id-ID', { maximumFractionDigits: 2 });
                    ratesText += `• 1 ${fromCurrency} = ${r} ${cur}\n`;
                }
            }

            const text = `💱 *Currency Exchange*\n\n` +
                `💵 ${formattedAmount} ${fromCurrency} = ${formattedResult} ${toCurrency}\n\n` +
                `📊 *Kurs ${fromCurrency} Hari Ini:*\n${ratesText}\n` +
                `⏰ Updated: ${new Date().toLocaleString('id-ID')}\n\n` +
                `𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch (err) {
            if (err.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: `❌ Mata uang ${from} tidak valid!\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengambil data kurs. Coba lagi.\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
            }
        }
    }
};
