// dm - kirim dm via bot
module.exports = {
    name: 'dm',
    aliases: ['pm'],
    description: 'kirim dm',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            if (args.length < 2) {
                await sock.sendMessage(chatId, { text: '*dm*\n\n.dm <nomor> <pesan>' }, { quoted: msg });
                return;
            }

            const number = args[0].replace(/\D/g, '');
            const message = args.slice(1).join(' ');

            if (!number || number.length < 10) {
                await sock.sendMessage(chatId, { text: 'nomor tidak valid' }, { quoted: msg });
                return;
            }

            const targetJid = `${number}@s.whatsapp.net`;
            const [result] = await sock.onWhatsApp(targetJid);

            if (!result?.exists) {
                await sock.sendMessage(chatId, { text: 'nomor tidak terdaftar wa' }, { quoted: msg });
                return;
            }

            await sock.sendMessage(targetJid, { text: message });
            await sock.sendMessage(chatId, { text: `terkirim ke ${number}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal kirim dm' }, { quoted: msg });
        }
    }
};
