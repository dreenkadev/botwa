const config = require('../../../config');

module.exports = {
    name: 'owner',
    aliases: ['creator'],
    description: 'Show bot owner info',

    async execute(sock, msg, { chatId }) {
        await sock.sendMessage(chatId, {
            text: ` *Bot Owner*\n\n Name: ${config.ownerName}\n Number: wa.me/${config.ownerNumber}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
        }, { quoted: msg });
    }
};
