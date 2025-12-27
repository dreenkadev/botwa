// antiviewonce - Toggle anti-viewonce per chat
const { isEnabled, setEnabled } = require('../../services/antiViewOnce');

module.exports = {
    name: 'antiviewonce',
    aliases: ['avo', 'viewonce'],
    description: 'toggle anti-viewonce',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            if (!action) {
                const status = isEnabled(chatId);
                await sock.sendMessage(chatId, {
                    text: `anti-viewonce: ${status ? 'on' : 'off'}\n\n.antiviewonce on\n.antiviewonce off`
                }, { quoted: msg });
                return;
            }

            if (action === 'on') {
                setEnabled(chatId, true);
                await sock.sendMessage(chatId, {
                    text: 'anti-viewonce aktif. viewonce akan di-save dan dikirim ke owner.'
                }, { quoted: msg });
                return;
            }

            if (action === 'off') {
                setEnabled(chatId, false);
                await sock.sendMessage(chatId, {
                    text: 'anti-viewonce nonaktif'
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                text: '.antiviewonce on/off'
            }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error: ' + err.message }, { quoted: msg });
        }
    }
};
