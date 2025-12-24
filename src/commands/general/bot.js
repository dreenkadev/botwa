// bot info command - menampilkan informasi bot dengan gambar
const fs = require('fs');
const path = require('path');
const config = require('../../../config');
const { getMode } = require('../../core/state');

module.exports = {
    name: 'bot',
    aliases: ['about', 'info'],
    description: 'tampilkan info bot',

    async execute(sock, msg, { chatId }) {
        try {
            const imagePath = path.join(__dirname, '../../../assets/dreenkadev.jpg');

            const botInfo = `*${config.botName || 'dreenkabot'}*

owner: ${config.ownerName || 'dreenka'}
prefix: ${config.prefix || '.'}
mode: ${getMode() || 'public'}
status: online

sosmed owner:
- ig: @dreenkadev
- github: dreenkadev

ketik ${config.prefix}menu untuk list command`;

            if (fs.existsSync(imagePath)) {
                await sock.sendMessage(chatId, {
                    image: fs.readFileSync(imagePath),
                    caption: botInfo
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: botInfo }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'gagal memuat info bot'
            }, { quoted: msg });
        }
    }
};
