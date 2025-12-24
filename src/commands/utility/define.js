const axios = require('axios');

module.exports = {
    name: 'define',
    aliases: ['dict', 'dictionary', 'meaning'],
    description: 'Get word definition',

    async execute(sock, msg, { chatId, args, quotedText }) {
        let word = args[0];

        if (!word && quotedText) {
            word = quotedText.split(/\s+/)[0];
        }

        if (!word) {
            await sock.sendMessage(chatId, {
                text: ' Please provide a word!\nUsage: .define <word>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
                timeout: 10000
            });

            const data = response.data[0];
            let text = ` *${data.word}*`;

            if (data.phonetic) {
                text += ` (${data.phonetic})`;
            }

            text += '\n\n';

            for (const meaning of data.meanings.slice(0, 3)) {
                text += `*${meaning.partOfSpeech}*\n`;
                for (const def of meaning.definitions.slice(0, 2)) {
                    text += `• ${def.definition}\n`;
                    if (def.example) {
                        text += `  _"${def.example}"_\n`;
                    }
                }
                text += '\n';
            }

            text += '𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃';

            await sock.sendMessage(chatId, { text }, { quoted: msg });
        } catch (err) {
            if (err.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: ` No definition found for "${word}"\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: ' Failed to get definition\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
            }
        }
    }
};
