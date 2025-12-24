const { setMode } = require('../../core/state');

module.exports = {
    name: 'self',
    aliases: ['selfmode'],
    description: 'Set bot to self mode (owner only)',
    ownerOnly: true,

    async execute(sock, msg, { chatId }) {
        setMode('self');
        await sock.sendMessage(chatId, {
            text: ' Bot is now in *Self Mode*\nOnly owner can use commands.\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
        }, { quoted: msg });
    }
};
