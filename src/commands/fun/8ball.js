// 8ball - random jawaban keberuntungan
module.exports = {
    name: '8ball',
    aliases: ['8b', 'fortune'],
    description: 'tanya keberuntungan',

    async execute(sock, msg, { chatId, args }) {
        try {
            const question = args.join(' ');

            if (!question) {
                await sock.sendMessage(chatId, { text: '*8ball*\n\n.8ball <pertanyaan>' }, { quoted: msg });
                return;
            }

            const answers = [
                'ya, pasti',
                'kemungkinan besar iya',
                'sepertinya iya',
                'coba tanya lagi nanti',
                'ga bisa jawab sekarang',
                'lebih baik ga usah tau',
                'kemungkinan kecil',
                'sepertinya tidak',
                'tidak',
                'jangan harap',
                'mungkin',
                'fifty fifty',
                'tergantung usahamu',
                'berdoa dulu',
                'percaya aja'
            ];

            const answer = answers[Math.floor(Math.random() * answers.length)];
            await sock.sendMessage(chatId, { text: `*8ball*\n\nq: ${question}\na: ${answer}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
