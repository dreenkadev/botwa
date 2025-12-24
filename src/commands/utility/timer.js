// timer - set timer
module.exports = {
    name: 'timer',
    aliases: ['countdown'],
    description: 'set timer',

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const seconds = parseInt(args[0]);

            if (!seconds || seconds < 1 || seconds > 3600) {
                await sock.sendMessage(chatId, { text: '*timer*\n\n.timer <detik>\nmaks: 3600 detik (1 jam)' }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, { text: `timer ${seconds} detik dimulai` }, { quoted: msg });

            setTimeout(async () => {
                try {
                    await sock.sendMessage(chatId, { text: `*timer*\n\n@${senderId}\nwaktu habis!`, mentions: [`${senderId}@s.whatsapp.net`] });
                } catch { }
            }, seconds * 1000);
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
