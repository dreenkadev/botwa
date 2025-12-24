const axios = require('axios');

module.exports = {
    name: 'currency',
    aliases: ['convert', 'exchange', 'kurs'],
    description: 'Convert currency',

    async execute(sock, msg, { chatId, args }) {
        if (args.length < 3) {
            await sock.sendMessage(chatId, {
                text: ' Currency Converter\nUsage: .currency <amount> <from> <to>\nExample: .currency 100 USD IDR\n\nCommon: USD, IDR, EUR, GBP, JPY, SGD, MYR, AUD\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        const amount = parseFloat(args[0]);
        const from = args[1].toUpperCase();
        const to = args[2].toUpperCase();

        if (isNaN(amount) || amount <= 0) {
            await sock.sendMessage(chatId, {
                text: ' Invalid amount\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`, {
                timeout: 10000
            });

            const rate = response.data.rates[to];

            if (!rate) {
                await sock.sendMessage(chatId, {
                    text: ` Invalid currency code: ${to}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
                return;
            }

            const result = amount * rate;

            const text = ` *Currency Conversion*

 ${amount.toLocaleString()} ${from}
   ↓
 ${result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${to}

 Rate: 1 ${from} = ${rate.toFixed(4)} ${to}

𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });
        } catch (err) {
            if (err.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: ` Invalid currency code: ${from}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: ' Failed to convert currency\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
            }
        }
    }
};
