const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'clearcache',
    aliases: ['cleartemp', 'cleanup'],
    description: 'Clear temporary files',
    ownerOnly: true,

    async execute(sock, msg, { chatId }) {
        const tempDirs = ['/tmp'];
        let deleted = 0;
        let failed = 0;

        try {
            for (const dir of tempDirs) {
                try {
                    const files = fs.readdirSync(dir);
                    for (const file of files) {
                        if (file.startsWith('input_') || file.startsWith('output_')) {
                            try {
                                fs.unlinkSync(path.join(dir, file));
                                deleted++;
                            } catch {
                                failed++;
                            }
                        }
                    }
                } catch { }
            }

            await sock.sendMessage(chatId, {
                text: ` *Cache Cleared*\n\n Deleted: ${deleted} files\n Failed: ${failed} files\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ` Failed: ${err.message}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        }
    }
};
