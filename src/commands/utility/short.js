const axios = require('axios');

module.exports = {
    name: 'short',
    aliases: ['shorten', 'tinyurl'],
    description: 'Shorten a URL',

    async execute(sock, msg, { chatId, args, quotedText }) {
        let url = args[0];

        if (!url && quotedText) {
            const urlMatch = quotedText.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) url = urlMatch[0];
        }

        if (!url) {
            await sock.sendMessage(chatId, {
                text: ' Please provide a URL!\nUsage: .short <url>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        try {
            const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
                timeout: 10000
            });

            await sock.sendMessage(chatId, {
                text: ` *URL Shortened*\n\n Original: ${url}\n Short: ${response.data}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ' Failed to shorten URL\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};
