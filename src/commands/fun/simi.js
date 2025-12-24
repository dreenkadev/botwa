// simi - dengan fallback response
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const fallbackReplies = [
    'hmm aku lagi ga mood', 'wkwk apaan sih', 'hehe lucu deh kamu',
    'aku ga ngerti', 'coba ngomong yang lain', 'hmm menarik',
    'iya iya paham', 'terus terus?', 'masa sih?', 'beneran?'
];

module.exports = {
    name: 'simi',
    aliases: ['simsimi', 'chat'],
    description: 'chat dengan simsimi',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            let text = args.join(' ');
            if (!text && quotedText) text = quotedText;

            if (!text) {
                await sock.sendMessage(chatId, { text: '*simi*\n\n.simi <pesan>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let reply = null;

            // api 1: simsimi
            try {
                const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(text)}&lc=id`, { timeout: 8000 });
                if (res.data?.success) reply = res.data.success;
            } catch { }

            // api 2: random ai response (fallback)
            if (!reply) {
                try {
                    const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(text)}&owner=bot&botname=simi`, { timeout: 8000 });
                    if (res.data?.response) reply = res.data.response;
                } catch { }
            }

            // fallback 3: local responses
            if (!reply) {
                reply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
            }

            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: reply }, { quoted: msg });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: fallbackReplies[0] }, { quoted: msg });
        }
    }
};
