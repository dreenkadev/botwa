// ping - cek response time bot
module.exports = {
    name: 'ping',
    aliases: ['p'],
    description: 'cek response time',

    async execute(sock, msg, { chatId }) {
        try {
            const start = Date.now();
            await sock.sendMessage(chatId, { text: 'pong' }, { quoted: msg });
            const latency = Date.now() - start;
            await sock.sendMessage(chatId, { text: `response: ${latency}ms` });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'pong' }, { quoted: msg });
        }
    }
};
