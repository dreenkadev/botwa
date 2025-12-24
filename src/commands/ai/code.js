// code - dengan reaction
const { askAI } = require('../../services/aiService');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'code',
    aliases: ['gencode', 'kodein'],
    description: 'generate code dengan ai',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            let prompt = args.join(' ');
            if (!prompt && quotedText) prompt = quotedText;

            if (!prompt) {
                await sock.sendMessage(chatId, { text: '*code*\n\n.code <deskripsi>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const systemPrompt = 'generate clean code. include brief explanation. specify language.';
            const response = await askAI(`${systemPrompt}\n\nrequest: ${prompt}`);

            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: response }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
        }
    }
};
