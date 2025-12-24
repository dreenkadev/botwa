const activeGames = new Map();

module.exports = {
    name: 'math',
    aliases: ['mathquiz', 'hitung'],
    description: 'Math quiz game',

    async execute(sock, msg, { chatId, args, senderId }) {
        // Check if answering
        if (args[0] && !isNaN(args[0])) {
            const game = activeGames.get(chatId);
            if (game && game.active) {
                const userAnswer = parseFloat(args[0]);

                if (Math.abs(userAnswer - game.answer) < 0.01) {
                    const time = ((Date.now() - game.startTime) / 1000).toFixed(1);
                    activeGames.delete(chatId);

                    await sock.sendMessage(chatId, {
                        text: `✅ *BENAR!*\n\n` +
                            `🎯 Jawaban: ${game.answer}\n` +
                            `⏱️ Waktu: ${time} detik\n` +
                            `👤 Pemenang: @${senderId}\n\n` +
                            `𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`,
                        mentions: [`${senderId}@s.whatsapp.net`]
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `❌ Salah! Coba lagi...\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                    }, { quoted: msg });
                }
                return;
            }
        }

        // Generate new question
        const difficulty = args[0] || 'easy';
        const question = generateQuestion(difficulty);

        activeGames.set(chatId, {
            active: true,
            answer: question.answer,
            startTime: Date.now()
        });

        // Auto-timeout after 30 seconds
        setTimeout(() => {
            const game = activeGames.get(chatId);
            if (game && game.startTime === question.startTime) {
                activeGames.delete(chatId);
            }
        }, 30000);

        await sock.sendMessage(chatId, {
            text: `🔢 *Math Quiz*\n\n` +
                `📝 Soal: ${question.question}\n\n` +
                `⏱️ Waktu: 30 detik\n` +
                `💡 Jawab dengan: .math <jawaban>\n\n` +
                `𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
        }, { quoted: msg });
    }
};

function generateQuestion(difficulty) {
    let a, b, op, answer, question;

    switch (difficulty) {
        case 'hard':
            a = Math.floor(Math.random() * 50) + 10;
            b = Math.floor(Math.random() * 50) + 10;
            op = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)];
            break;
        case 'medium':
            a = Math.floor(Math.random() * 30) + 5;
            b = Math.floor(Math.random() * 20) + 5;
            op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
            break;
        default: // easy
            a = Math.floor(Math.random() * 20) + 1;
            b = Math.floor(Math.random() * 15) + 1;
            op = ['+', '-'][Math.floor(Math.random() * 2)];
    }

    question = `${a} ${op} ${b}`;

    switch (op) {
        case '+': answer = a + b; break;
        case '-': answer = a - b; break;
        case '×': answer = a * b; break;
        case '÷':
            // Make sure it's a whole number
            a = b * (Math.floor(Math.random() * 10) + 1);
            answer = a / b;
            question = `${a} ${op} ${b}`;
            break;
    }

    return { question, answer, startTime: Date.now() };
}
