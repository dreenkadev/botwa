// ai - dengan reaction
const { askAI } = require('../../services/aiService');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'ai',
    aliases: ['ask', 'gpt'],
    description: 'chat dengan ai',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            let prompt = args.join(' ');
            if (!prompt && quotedText) prompt = quotedText;

            if (!prompt) {
                await sock.sendMessage(chatId, { text: '*ai*\n\n.ai <pesan>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            const response = await askAI(prompt);
            await reactDone(sock, msg);

            await sock.sendMessage(chatId, { text: response }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
        }
    }
};
