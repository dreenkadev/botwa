// menu - list semua command
const config = require('../../../config');

const CATEGORY_NAMES = {
    general: 'GENERAL',
    owner: 'OWNER',
    group: 'GROUP',
    moderation: 'MODERATION',
    media: 'MEDIA',
    utility: 'UTILITY',
    fun: 'FUN',
    ai: 'AI'
};

module.exports = {
    name: 'menu',
    aliases: ['m', 'commands', 'cmds'],
    description: 'list semua command',

    async execute(sock, msg, { chatId, isOwner }) {
        try {
            const { getCommandsByCategory, getCategories } = require('../../handlers/commandHandler');
            const commandsByCategory = getCommandsByCategory();
            const categories = getCategories();

            let menuText = `${config.botName || 'DreenkaBot'}
━━━━━━━━━━━━━━━━━━━━
Prefix: ${config.prefix}
━━━━━━━━━━━━━━━━━━━━

`;

            for (const category of categories) {
                if (category === 'owner' && !isOwner) continue;

                const cmds = commandsByCategory.get(category) || [];
                if (cmds.length === 0) continue;

                const name = CATEGORY_NAMES[category] || category.toUpperCase();
                menuText += `[ ${name} ]\n`;

                for (const cmd of cmds) {
                    menuText += `  ${config.prefix}${cmd.name}\n`;
                }
                menuText += '\n';
            }

            menuText += `━━━━━━━━━━━━━━━━━━━━
${config.prefix}mi <cmd> untuk info
${config.signature}`;

            await sock.sendMessage(chatId, { text: menuText.trim() }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal memuat menu' }, { quoted: msg });
        }
    }
};
