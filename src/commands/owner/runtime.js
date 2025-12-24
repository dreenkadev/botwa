// runtime - uptime bot
const os = require('os');
const startTime = Date.now();

module.exports = {
    name: 'runtime',
    aliases: ['uptime', 'up'],
    description: 'cek uptime bot',

    async execute(sock, msg, { chatId }) {
        try {
            const uptime = Date.now() - startTime;
            const days = Math.floor(uptime / 86400000);
            const hours = Math.floor((uptime % 86400000) / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);

            await sock.sendMessage(chatId, {
                text: `*runtime*\n\nuptime: ${days}d ${hours}h ${minutes}m ${seconds}s\nplatform: ${os.platform()} ${os.arch()}\nnode: ${process.version}`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal memuat runtime' }, { quoted: msg });
        }
    }
};
