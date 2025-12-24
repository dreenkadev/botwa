module.exports = {
    name: 'shutdown',
    aliases: ['stop', 'exit'],
    description: 'Gracefully shutdown the bot',
    ownerOnly: true,

    async execute(sock, msg, { chatId }) {
        await sock.sendMessage(chatId, {
            text: ' Shutting down bot...\nGoodbye!\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
        }, { quoted: msg });

        setTimeout(() => {
            process.exit(0);
        }, 1500);
    }
};
