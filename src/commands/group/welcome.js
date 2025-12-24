// welcome - set pesan welcome
const welcomeMessages = new Map();

module.exports = {
    name: 'welcome',
    aliases: ['setwelcome'],
    description: 'set pesan welcome',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            if (action === 'on') {
                const message = args.slice(1).join(' ') || 'selamat datang @user di grup!';
                welcomeMessages.set(chatId, { enabled: true, message });
                await sock.sendMessage(chatId, { text: `welcome aktif\npesan: ${message}` }, { quoted: msg });
            } else if (action === 'off') {
                welcomeMessages.delete(chatId);
                await sock.sendMessage(chatId, { text: 'welcome nonaktif' }, { quoted: msg });
            } else {
                const current = welcomeMessages.get(chatId);
                const status = current?.enabled ? 'aktif' : 'nonaktif';
                await sock.sendMessage(chatId, { text: `*welcome*\n\nstatus: ${status}\n\n.welcome on <pesan>\n.welcome off\n\ngunakan @user untuk mention member baru` }, { quoted: msg });
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};

module.exports.getWelcome = (chatId) => welcomeMessages.get(chatId);
