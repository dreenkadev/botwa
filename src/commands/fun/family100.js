// family100 - Game Family 100 (dengan data lengkap)
const fs = require('fs');
const path = require('path');
const { reactProcessing } = require('../../utils/reaction');

// Game state storage
const games = new Map();

// Load questions from JSON
let QUESTIONS = [];
try {
    const dataPath = path.join(__dirname, '../../data/family100.json');
    QUESTIONS = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch {
    // Fallback data
    QUESTIONS = [
        { soal: "Sebutkan hewan berkaki 4!", jawaban: ["kucing", "anjing", "sapi", "kambing", "kuda"] },
        { soal: "Sebutkan sayuran berwarna hijau!", jawaban: ["bayam", "kangkung", "brokoli", "selada", "sawi"] }
    ];
}

module.exports = {
    name: 'family100',
    aliases: ['f100', 'family'],
    description: 'Game tebak jawaban Family 100',
    groupOnly: true,

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const action = args[0]?.toLowerCase();

            // Start game
            if (!action || action === 'start') {
                if (games.has(chatId)) {
                    await sock.sendMessage(chatId, {
                        text: '⚠️ Game masih berlangsung! Ketik .f100 stop untuk menghentikan.'
                    }, { quoted: msg });
                    return;
                }

                // Pick random question
                const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
                const answers = Array.isArray(question.jawaban) ? question.jawaban : [question.jawaban];

                games.set(chatId, {
                    question: question.soal,
                    answers: answers.map(a => ({ text: a.toLowerCase(), found: false })),
                    score: 0,
                    startTime: Date.now(),
                    players: new Map()
                });

                const answerHints = answers.map((a, i) =>
                    `${i + 1}. ${'?'.repeat(a.length)}`
                ).join('\n');

                await sock.sendMessage(chatId, {
                    text: `*🎮 FAMILY 100*\n\n❓ *${question.soal}*\n\n📋 *Jawaban (${answers.length}):*\n${answerHints}\n\n⏰ Waktu: 2 menit\n💬 Ketik jawaban langsung di chat!`
                }, { quoted: msg });

                // Auto end after 2 minutes
                setTimeout(() => {
                    if (games.has(chatId)) {
                        endGame(sock, chatId);
                    }
                }, 120000);

                return;
            }

            // Stop game
            if (action === 'stop' || action === 'end') {
                if (!games.has(chatId)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Tidak ada game yang berlangsung.'
                    }, { quoted: msg });
                    return;
                }

                await endGame(sock, chatId, msg);
                return;
            }

            // Check answer
            if (games.has(chatId)) {
                const game = games.get(chatId);
                const answer = args.join(' ').toLowerCase().trim();

                for (const ans of game.answers) {
                    if (!ans.found && ans.text.includes(answer)) {
                        ans.found = true;
                        game.score += 10;

                        // Track player score
                        const playerScore = game.players.get(senderId) || 0;
                        game.players.set(senderId, playerScore + 10);

                        const remaining = game.answers.filter(a => !a.found).length;

                        await sock.sendMessage(chatId, {
                            text: `✅ *BENAR!*\n\n🎯 "${ans.text}" = 10 poin\n📊 Total: ${game.score} poin\n📝 Sisa: ${remaining} jawaban`
                        }, { quoted: msg });

                        // Check if all answers found
                        if (remaining === 0) {
                            await endGame(sock, chatId, msg, true);
                        }

                        return;
                    }
                }
            }

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: '❌ Error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function endGame(sock, chatId, msg = null, allFound = false) {
    const game = games.get(chatId);
    if (!game) return;

    const answers = game.answers.map((a, i) =>
        `${a.found ? '✅' : '❌'} ${i + 1}. ${a.text}`
    ).join('\n');

    // Get top players
    const players = [...game.players.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, score], i) => `${i + 1}. @${id.split('@')[0]} - ${score} poin`);

    const text = `*🎮 GAME OVER!*\n\n${allFound ? '🎉 Semua jawaban ditemukan!' : '⏰ Waktu habis!'}\n\n❓ *${game.question}*\n\n📋 *Jawaban:*\n${answers}\n\n📊 *Total Skor:* ${game.score}\n\n🏆 *Top Players:*\n${players.length > 0 ? players.join('\n') : 'Tidak ada'}`;

    games.delete(chatId);

    await sock.sendMessage(chatId, { text }, { quoted: msg });
}
