// tebakbendera - Game tebak bendera negara (dengan data lengkap)
const fs = require('fs');
const path = require('path');
const { reactProcessing } = require('../../utils/reaction');

// Game state storage
const games = new Map();

// Load flags from JSON
let FLAGS = [];
try {
    const dataPath = path.join(__dirname, '../../data/tebakbendera.json');
    FLAGS = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch {
    // Fallback data
    FLAGS = [
        { soal: '🇮🇩', jawaban: 'Indonesia' },
        { soal: '🇲🇾', jawaban: 'Malaysia' },
        { soal: '🇸🇬', jawaban: 'Singapura' },
        { soal: '🇯🇵', jawaban: 'Jepang' },
        { soal: '🇰🇷', jawaban: 'Korea Selatan' }
    ];
}

module.exports = {
    name: 'tebakbendera',
    aliases: ['bendera', 'flag', 'guessflag'],
    description: 'Game tebak bendera negara',

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const action = args[0]?.toLowerCase();

            // Start game
            if (!action || action === 'start') {
                if (games.has(chatId)) {
                    const game = games.get(chatId);
                    await sock.sendMessage(chatId, {
                        text: `⚠️ Game masih berlangsung!\n\n${game.flag}\n\nKetik .bendera stop untuk berhenti.`
                    }, { quoted: msg });
                    return;
                }

                // Pick random flag
                const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];

                games.set(chatId, {
                    flag: flag.soal,
                    answer: flag.jawaban.toLowerCase(),
                    attempts: 0,
                    startTime: Date.now()
                });

                await sock.sendMessage(chatId, {
                    text: `*🚩 TEBAK BENDERA*\n\n${flag.soal}\n\nBendera negara apa ini?\n\n⏰ Waktu: 60 detik\n💬 Ketik jawaban langsung!`
                }, { quoted: msg });

                // Auto end after 60 seconds
                setTimeout(() => {
                    if (games.has(chatId)) {
                        const game = games.get(chatId);
                        games.delete(chatId);
                        sock.sendMessage(chatId, {
                            text: `⏰ *Waktu Habis!*\n\n${game.flag} = *${game.answer.toUpperCase()}*`
                        });
                    }
                }, 60000);

                return;
            }

            // Stop game
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
                    text: `🏳️ *Menyerah!*\n\n${game.flag} = *${game.answer.toUpperCase()}*`
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
                const hint = getHint(game.answer);
                await sock.sendMessage(chatId, {
                    text: `💡 *Hint:* ${hint}`
                }, { quoted: msg });
                return;
            }

            // Check answer
            if (games.has(chatId)) {
                const game = games.get(chatId);
                const answer = args.join(' ').toLowerCase().trim();
                game.attempts++;

                // Check if answer matches (partial match allowed)
                const isCorrect = game.answer.includes(answer) || answer.includes(game.answer) ||
                    game.answer === answer;

                if (isCorrect) {
                    const time = Math.floor((Date.now() - game.startTime) / 1000);
                    games.delete(chatId);

                    await sock.sendMessage(chatId, {
                        text: `✅ *BENAR!*\n\n${game.flag} = *${game.answer.toUpperCase()}*\n\n⏱️ Waktu: ${time} detik\n🔢 Percobaan: ${game.attempts}x`
                    }, { quoted: msg });
                } else if (game.attempts >= 5) {
                    games.delete(chatId);
                    await sock.sendMessage(chatId, {
                        text: `❌ *Percobaan habis!*\n\n${game.flag} = *${game.answer.toUpperCase()}*`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `❌ Salah! Sisa percobaan: ${5 - game.attempts}x\n\n💡 Ketik .bendera hint untuk petunjuk`
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

function getHint(answer) {
    const first = answer[0].toUpperCase();
    const last = answer[answer.length - 1];
    const length = answer.length;
    return `${first}${'_'.repeat(Math.max(0, length - 2))}${last} (${length} huruf)`;
}
