const axios = require('axios');

module.exports = {
    name: 'news',
    aliases: ['berita'],
    description: 'Get latest news headlines',

    async execute(sock, msg, { chatId, args }) {
        const category = args[0]?.toLowerCase() || 'general';
        const validCategories = ['general', 'business', 'technology', 'sports', 'entertainment', 'health', 'science'];

        if (!validCategories.includes(category)) {
            await sock.sendMessage(chatId, {
                text: ` News Categories:\n${validCategories.join(', ')}\n\nUsage: .news [category]\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
            return;
        }

        try {
            // Using Google News RSS as free alternative
            const response = await axios.get(`https://news.google.com/rss/search?q=${category}&hl=en-US&gl=US&ceid=US:en`, {
                timeout: 10000
            });

            // Parse simple RSS
            const items = response.data.match(/<item>[\s\S]*?<\/item>/g) || [];
            const headlines = [];

            for (let i = 0; i < Math.min(5, items.length); i++) {
                const titleMatch = items[i].match(/<title>([\s\S]*?)<\/title>/);
                const linkMatch = items[i].match(/<link>([\s\S]*?)<\/link>/);
                if (titleMatch) {
                    const title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
                    headlines.push(`${i + 1}. ${title}`);
                }
            }

            if (headlines.length === 0) {
                await sock.sendMessage(chatId, {
                    text: ' No news found\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
                return;
            }

            const text = ` *Latest ${category.charAt(0).toUpperCase() + category.slice(1)} News*\n\n${headlines.join('\n\n')}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ' Failed to fetch news\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};
