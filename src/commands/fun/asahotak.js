// asahotak - Game teka-teki asah otak (dengan data lengkap)
const fs = require('fs');
const path = require('path');
const { reactProcessing } = require('../../utils/reaction');

// Game state
const games = new Map();

// Load riddles from JSON
let RIDDLES = [];
try {
    const dataPath = path.join(__dirname, '../../data/asahotak.json');
    RIDDLES = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch {
    // Fallback data
    RIDDLES = [
        { soal: 'Apa yang punya kaki tapi tidak bisa berjalan?', jawaban: 'meja' },
        { soal: 'Apa yang makin dipotong makin panjang?', jawaban: 'jalan' }
    ];
}

module.exports = {
    name: 'asahotak',
    aliases: ['riddle', 'teka-teki', 'tebaktebakan'],
    description: 'Game teka-teki asah otak',

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const action = args[0]?.toLowerCase();

            // Start game
            if (!action || action === 'start') {
                if (games.has(chatId)) {
                    const game = games.get(chatId);
                    await sock.sendMessage(chatId, {
                        text: `⚠️ Game masih berlangsung!\n\n❓ *${game.question}*\n\nKetik .asahotak stop untuk berhenti.`
                    }, { quoted: msg });
                    return;
                }

                // Pick random riddle
                const riddle = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];

                games.set(chatId, {
                    question: riddle.soal,
                    answer: riddle.jawaban.toLowerCase(),
                    attempts: 0,
                    startTime: Date.now()
                });

                await sock.sendMessage(chatId, {
                    text: `*🧠 ASAH OTAK*\n\n❓ *${riddle.soal}*\n\n⏰ Waktu: 90 detik\n💬 Ketik jawaban langsung!`
                }, { quoted: msg });

                // Auto end after 90 seconds
                setTimeout(() => {
                    if (games.has(chatId)) {
                        const game = games.get(chatId);
                        games.delete(chatId);
                        sock.sendMessage(chatId, {
                            text: `⏰ *Waktu Habis!*\n\n❓ ${game.question}\n✅ Jawaban: *${game.answer.toUpperCase()}*`
                        });
                    }
                }, 90000);

                return;
            }

            // Stop/give up
            if (action === 'stop' || action === 'end' || action === 'nyerah') {
                if (!games.has(chatId)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Tidak ada game yang berlangsung.'
                    }, { quoted: msg });
                    return;
                }

                const game = games.get(chatId);
                games.delete(chatId);

                await sock.sendMessage(chatId, {
                    text: `🏳️ *Menyerah!*\n\n❓ ${game.question}\n✅ Jawaban: *${game.answer.toUpperCase()}*`
                }, { quoted: msg });
                return;
            }

            // Hint
            if (action === 'hint' || action === 'clue') {
                if (!games.has(chatId)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Tidak ada game yang berlangsung.'
                    }, { quoted: msg });
                    return;
                }

                const game = games.get(chatId);
                const hint = game.answer[0].toUpperCase() + '_'.repeat(game.answer.length - 1);
                await sock.sendMessage(chatId, {
                    text: `💡 *Hint:* ${hint} (${game.answer.length} huruf)`
                }, { quoted: msg });
                return;
            }

            // Check answer
            if (games.has(chatId)) {
                const game = games.get(chatId);
                const answer = args.join(' ').toLowerCase().trim();
                game.attempts++;

                if (answer === game.answer.toLowerCase() || game.answer.includes(answer)) {
                    const time = Math.floor((Date.now() - game.startTime) / 1000);
                    games.delete(chatId);

                    await sock.sendMessage(chatId, {
                        text: `✅ *BENAR!*\n\n❓ ${game.question}\n✅ Jawaban: *${game.answer.toUpperCase()}*\n\n⏱️ Waktu: ${time} detik\n🔢 Percobaan: ${game.attempts}x`
                    }, { quoted: msg });
                } else if (game.attempts >= 3) {
                    games.delete(chatId);
                    await sock.sendMessage(chatId, {
                        text: `❌ *Percobaan habis!*\n\n❓ ${game.question}\n✅ Jawaban: *${game.answer.toUpperCase()}*`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `❌ Salah! Sisa percobaan: ${3 - game.attempts}x\n\n💡 Ketik .asahotak hint untuk petunjuk.`
                    }, { quoted: msg });
                }
            }

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: '❌ Error: ' + err.message
            }, { quoted: msg });
        }
    }
};
