const os = require('os');
const { getStats, getAllUsers } = require('../../utils/database');

// Track bot start time
const startTime = Date.now();

module.exports = {
    name: 'stats',
    aliases: ['status', 'info'],
    description: 'Show bot statistics',

    async execute(sock, msg, { chatId }) {
        try {
            const uptime = Date.now() - startTime;
            const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
            const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
            const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
            const seconds = Math.floor((uptime % (60 * 1000)) / 1000);

            const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            // System info
            const totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2);
            const freeMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(2);
            const usedMem = (totalMem - freeMem).toFixed(2);
            const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

            const cpuCount = os.cpus().length;
            const platform = os.platform();
            const hostname = os.hostname();

            // Get groups
            let groupCount = 0;
            try {
                const groups = await sock.groupFetchAllParticipating();
                groupCount = Object.keys(groups).length;
            } catch { }

            // Get user stats
            let totalUsers = 0;
            let totalCommands = 0;
            try {
                const users = getAllUsers();
                totalUsers = Object.keys(users).length;
                for (const user of Object.values(users)) {
                    totalCommands += user.commandCount || 0;
                }
            } catch { }

            const text = ` *Bot Statistics*

 *Uptime:* ${uptimeStr}

 *Usage:*
• Groups: ${groupCount}
• Users: ${totalUsers}
• Commands Run: ${totalCommands}

 *System:*
• Platform: ${platform}
• Host: ${hostname}
• CPUs: ${cpuCount} cores
• Memory: ${usedMem}/${totalMem} GB (${memPercent}%)

 *Bot Info:*
• Node.js: ${process.version}
• PID: ${process.pid}

𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ` Failed: ${err.message}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        }
    }
};
