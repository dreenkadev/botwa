// setwelcome - Configure welcome message with image
const { setWelcomeSettings, getWelcomeSettings, generateWelcomeImage } = require('../../utils/welcomeImage');

module.exports = {
    name: 'setwelcome',
    aliases: ['welcome', 'selamatdatang'],
    description: 'atur pesan welcome grup',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args, isAdmin }) {
        try {
            const action = args[0]?.toLowerCase();
            const current = getWelcomeSettings(chatId);

            // Show current settings
            if (!action) {
                let text = `welcome settings\n\n`;
                text += `status: ${current.enabled ? 'on' : 'off'}\n`;
                text += `message: ${current.message || '(default)'}\n\n`;
                text += `commands:\n`;
                text += `.setwelcome on - aktifkan\n`;
                text += `.setwelcome off - matikan\n`;
                text += `.setwelcome msg <pesan> - set pesan\n`;
                text += `.setwelcome test - test gambar\n\n`;
                text += `variabel: {name} {group} {count}`;

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // Toggle on
            if (action === 'on') {
                setWelcomeSettings(chatId, { enabled: true });
                await sock.sendMessage(chatId, { text: 'welcome message aktif' }, { quoted: msg });
                return;
            }

            // Toggle off
            if (action === 'off') {
                setWelcomeSettings(chatId, { enabled: false });
                await sock.sendMessage(chatId, { text: 'welcome message nonaktif' }, { quoted: msg });
                return;
            }

            // Set message
            if (action === 'msg' || action === 'message') {
                const message = args.slice(1).join(' ');
                if (!message) {
                    await sock.sendMessage(chatId, { text: '.setwelcome msg <pesan>' }, { quoted: msg });
                    return;
                }
                setWelcomeSettings(chatId, { message });
                await sock.sendMessage(chatId, { text: `pesan welcome diset:\n${message}` }, { quoted: msg });
                return;
            }

            // Test welcome image
            if (action === 'test') {
                const metadata = await sock.groupMetadata(chatId);
                const image = await generateWelcomeImage({
                    name: 'Test User',
                    groupName: metadata.subject,
                    memberCount: metadata.participants.length,
                    type: 'welcome'
                });

                await sock.sendMessage(chatId, {
                    image,
                    caption: current.message?.replace('{name}', 'Test User')
                        .replace('{group}', metadata.subject)
                        .replace('{count}', metadata.participants.length) || 'welcome!'
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, { text: 'action tidak dikenal' }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error: ' + err.message }, { quoted: msg });
        }
    }
};
