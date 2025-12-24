// poll - buat polling
module.exports = {
    name: 'poll',
    aliases: ['vote'],
    description: 'buat polling',
    groupOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const input = args.join(' ');
            const parts = input.split('|').map(p => p.trim()).filter(p => p);

            if (parts.length < 3) {
                await sock.sendMessage(chatId, { text: '*poll*\n\n.poll <pertanyaan> | <opsi1> | <opsi2> | ...\n\ncontoh: .poll makan apa? | nasi | mie | bakso' }, { quoted: msg });
                return;
            }

            const question = parts[0];
            const options = parts.slice(1);

            await sock.sendMessage(chatId, {
                poll: {
                    name: question,
                    values: options,
                    selectableCount: 1
                }
            });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal buat poll' }, { quoted: msg });
        }
    }
};
