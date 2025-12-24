const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'setprefix',
    aliases: ['prefix'],
    description: 'Change bot command prefix',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args }) {
        const newPrefix = args[0];

        if (!newPrefix) {
            const config = require('../../../config');
            await sock.sendMessage(chatId, {
                text: ` Current prefix: ${config.prefix}\n\nUsage: .setprefix <new prefix>\nExample: .setprefix !\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
            return;
        }

        if (newPrefix.length > 3) {
            await sock.sendMessage(chatId, {
                text: ' Prefix too long (max 3 characters)\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            const configPath = path.join(__dirname, '..', 'config.js');
            let configContent = fs.readFileSync(configPath, 'utf8');

            // Replace prefix in config
            configContent = configContent.replace(
                /prefix:\s*['"`].*?['"`]/,
                `prefix: '${newPrefix}'`
            );

            fs.writeFileSync(configPath, configContent);

            // Clear require cache to reload config
            delete require.cache[require.resolve('../config')];

            await sock.sendMessage(chatId, {
                text: ` Prefix changed to: ${newPrefix}\n\n Restart bot for changes to take full effect\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ` Failed: ${err.message}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        }
    }
};
