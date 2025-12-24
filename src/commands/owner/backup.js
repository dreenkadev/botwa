const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'backup',
    aliases: ['backupdb'],
    description: 'Backup database files',
    ownerOnly: true,

    async execute(sock, msg, { chatId }) {
        const dbDir = path.join(__dirname, '..', 'database');
        const backupDir = path.join(__dirname, '..', 'backups');

        try {
            // Create backup directory if not exists
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `backup_${timestamp}`);
            fs.mkdirSync(backupPath, { recursive: true });

            // Copy database files
            const files = fs.readdirSync(dbDir);
            let copied = 0;

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const src = path.join(dbDir, file);
                    const dest = path.join(backupPath, file);
                    fs.copyFileSync(src, dest);
                    copied++;
                }
            }

            await sock.sendMessage(chatId, {
                text: ` *Backup Complete*\n\n Location: backups/backup_${timestamp}\n Files: ${copied}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ` Failed: ${err.message}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        }
    }
};
