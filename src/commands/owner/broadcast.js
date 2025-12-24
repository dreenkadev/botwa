const config = require('../../../config');

module.exports = {
    name: 'broadcast',
    aliases: ['bc'],
    description: 'Broadcast message to all groups',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args }) {
        const message = args.join(' ');

        if (!message) {
            await sock.sendMessage(chatId, {
                text: ' Please provide a message to broadcast!\nUsage: .broadcast <message>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);

            if (groupIds.length === 0) {
                await sock.sendMessage(chatId, {
                    text: ' Bot is not in any groups\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                text: ` Broadcasting to ${groupIds.length} groups...`
            }, { quoted: msg });

            let success = 0;
            let failed = 0;

            for (const groupId of groupIds) {
                try {
                    await sock.sendMessage(groupId, {
                        text: ` *Broadcast*\n\n${message}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                    });
                    success++;
                    // Add delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch {
                    failed++;
                }
            }

            await sock.sendMessage(chatId, {
                text: ` *Broadcast Complete*\n\n Success: ${success}\n Failed: ${failed}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ` Failed: ${err.message}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
        }
    }
};
