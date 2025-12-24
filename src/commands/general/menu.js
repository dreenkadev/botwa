// menu - list semua command
const config = require('../../../config');

const CATEGORY_NAMES = {
    general: 'general',
    owner: 'owner',
    group: 'group',
    moderation: 'moderation',
    media: 'media',
    utility: 'utility',
    fun: 'fun',
    ai: 'ai'
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

            let menuText = `*${config.botName || 'dreenkabot'}*
prefix: ${config.prefix}

`;

            for (const category of categories) {
                if (category === 'owner' && !isOwner) continue;

                const cmds = commandsByCategory.get(category) || [];
                if (cmds.length === 0) continue;

                const name = CATEGORY_NAMES[category] || category;
                menuText += `-- ${name} --\n`;

                const cmdList = cmds.map(cmd => config.prefix + cmd.name).join(', ');
                menuText += `${cmdList}\n\n`;
            }

            menuText += `ketik ${config.prefix}mi <cmd> untuk info`;

            await sock.sendMessage(chatId, { text: menuText.trim() }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal memuat menu' }, { quoted: msg });
        }
    }
};
