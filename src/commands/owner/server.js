// server - status server (cpu, ram, disk)
const os = require('os');
const { execSync } = require('child_process');

module.exports = {
    name: 'server',
    aliases: ['sv', 'serverinfo'],
    description: 'status server',
    ownerOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            const cpus = os.cpus();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;

            let diskInfo = 'n/a';
            try { diskInfo = execSync("df -h / | tail -1 | awk '{print $3\"/\"$2\" (\"$5\")\"}'").toString().trim(); } catch { }

            const formatBytes = b => (b / 1073741824).toFixed(2) + ' gb';

            await sock.sendMessage(chatId, {
                text: `*server status*\n\nplatform: ${os.platform()} ${os.arch()}\nhostname: ${os.hostname()}\nuptime: ${Math.floor(os.uptime() / 3600)}h\n\nmemory:\n- total: ${formatBytes(totalMem)}\n- used: ${formatBytes(usedMem)}\n- free: ${formatBytes(freeMem)}\n- usage: ${((usedMem / totalMem) * 100).toFixed(1)}%\n\ncpu: ${cpus[0]?.model || 'unknown'}\ncores: ${cpus.length}\n\ndisk: ${diskInfo}`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal memuat server info' }, { quoted: msg });
        }
    }
};
