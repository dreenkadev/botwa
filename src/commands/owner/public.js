const { setMode } = require('../../core/state');

module.exports = {
    name: 'public',
    aliases: ['publicmode'],
    description: 'Set bot to public mode',
    ownerOnly: true,

    async execute(sock, msg, { chatId }) {
        setMode('public');
        await sock.sendMessage(chatId, {
            text: ' Bot is now in *Public Mode*\nEveryone can use commands.\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
        }, { quoted: msg });
    }
};
