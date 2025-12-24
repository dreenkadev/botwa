const axios = require('axios');

module.exports = {
    name: 'screenshot',
    aliases: ['ss', 'ssweb'],
    description: 'Take screenshot of a website',

    async execute(sock, msg, { chatId, args }) {
        let url = args[0];

        if (!url) {
            await sock.sendMessage(chatId, {
                text: 'Please provide a URL!\nUsage: .screenshot <url>\n\nDreenkaDev'
            }, { quoted: msg });
            return;
        }

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        await sock.sendMessage(chatId, {
            text: 'Taking screenshot...\n\nDreenkaDev'
        }, { quoted: msg });

        try {
            // Using free screenshot API
            const apiUrl = `https://image.thum.io/get/width/1280/crop/720/noanimate/${encodeURIComponent(url)}`;

            const response = await axios.get(apiUrl, {
                timeout: 30000,
                responseType: 'arraybuffer'
            });

            await sock.sendMessage(chatId, {
                image: Buffer.from(response.data),
                caption: `Screenshot of ${url}\n\nDreenkaDev`
            }, { quoted: msg });
        } catch (err) {
            console.error('[Screenshot Error]', err.message);
            await sock.sendMessage(chatId, {
                text: `Failed to take screenshot: ${err.message}\n\nDreenkaDev`
            }, { quoted: msg });
        }
    }
};
