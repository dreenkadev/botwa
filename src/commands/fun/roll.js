// roll - random dice/number
module.exports = {
    name: 'roll',
    aliases: ['dice', 'random'],
    description: 'roll dice atau random number',

    async execute(sock, msg, { chatId, args }) {
        try {
            const max = parseInt(args[0]) || 6;
            const result = Math.floor(Math.random() * max) + 1;
            await sock.sendMessage(chatId, { text: `*roll*\n\nhasil: ${result} (1-${max})` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
