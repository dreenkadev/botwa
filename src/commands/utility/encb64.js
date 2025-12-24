// encb64 - encode base64
module.exports = {
    name: 'encb64',
    aliases: ['base64', 'encode'],
    description: 'encode base64',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            let text = args.join(' ');
            if (!text && quotedText) text = quotedText;

            if (!text) {
                await sock.sendMessage(chatId, { text: '*encb64*\n\n.encb64 <teks>' }, { quoted: msg });
                return;
            }

            const encoded = Buffer.from(text).toString('base64');
            await sock.sendMessage(chatId, { text: `*encoded*\n\n${encoded}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
