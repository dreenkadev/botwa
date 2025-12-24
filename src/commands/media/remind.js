// remind - set reminder
const reminders = new Map();

module.exports = {
    name: 'remind',
    aliases: ['reminder', 'alarm'],
    description: 'set reminder',

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            if (args.length < 2) {
                await sock.sendMessage(chatId, { text: '*remind*\n\n.remind <menit> <pesan>\ncontoh: .remind 5 makan siang' }, { quoted: msg });
                return;
            }

            const minutes = parseInt(args[0]);
            const message = args.slice(1).join(' ');

            if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
                await sock.sendMessage(chatId, { text: 'waktu harus 1-1440 menit' }, { quoted: msg });
                return;
            }

            const reminderId = Date.now();
            await sock.sendMessage(chatId, { text: `reminder diset: ${minutes} menit\npesan: ${message}` }, { quoted: msg });

            setTimeout(async () => {
                try {
                    await sock.sendMessage(chatId, {
                        text: `*reminder*\n\n@${senderId}\n${message}`,
                        mentions: [`${senderId}@s.whatsapp.net`]
                    });
                } catch { }
            }, minutes * 60000);
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
