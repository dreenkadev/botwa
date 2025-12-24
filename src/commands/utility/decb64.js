// decb64 - decode base64
module.exports = {
    name: 'decb64',
    aliases: ['decode'],
    description: 'decode base64',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            let text = args.join(' ');
            if (!text && quotedText) text = quotedText;

            if (!text) {
                await sock.sendMessage(chatId, { text: '*decb64*\n\n.decb64 <base64>' }, { quoted: msg });
                return;
            }

            const decoded = Buffer.from(text, 'base64').toString('utf8');
            await sock.sendMessage(chatId, { text: `*decoded*\n\n${decoded}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'base64 tidak valid' }, { quoted: msg });
        }
    }
};
