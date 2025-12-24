// crypto - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'crypto',
    aliases: ['btc', 'eth', 'coin'],
    description: 'cek harga crypto',

    async execute(sock, msg, { chatId, args }) {
        try {
            const coin = args[0]?.toLowerCase() || 'bitcoin';
            const aliases = { 'btc': 'bitcoin', 'eth': 'ethereum', 'bnb': 'binancecoin', 'sol': 'solana', 'xrp': 'ripple', 'doge': 'dogecoin' };
            const coinId = aliases[coin] || coin;

            await reactProcessing(sock, msg);

            let result = null;

            // api 1: coingecko
            try {
                const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd,idr&include_24hr_change=true`, { timeout: 8000 });
                const data = res.data?.[coinId];
                if (data) {
                    result = `*${coinId.toUpperCase()}*\n\nusd: $${data.usd?.toLocaleString()}\nidr: rp ${data.idr?.toLocaleString()}\n24h: ${data.usd_24h_change?.toFixed(2)}%`;
                }
            } catch { }

            // api 2: coinpaprika (fallback)
            if (!result) {
                try {
                    const res = await axios.get(`https://api.coinpaprika.com/v1/tickers/${coinId}-${coinId === 'bitcoin' ? 'btc' : coin}`, { timeout: 8000 });
                    if (res.data?.quotes?.USD) {
                        const usd = res.data.quotes.USD;
                        result = `*${res.data.name}*\n\nusd: $${usd.price?.toLocaleString()}\n24h: ${usd.percent_change_24h?.toFixed(2)}%`;
                    }
                } catch { }
            }

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, { text: result }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'tidak ditemukan' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
