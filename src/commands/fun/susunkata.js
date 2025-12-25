// susunkata - Game susun kata acak (dengan data lengkap)
const fs = require('fs');
const path = require('path');
const { reactProcessing } = require('../../utils/reaction');

// Game state
const games = new Map();

// Load words from JSON
let WORDS = [];
try {
    const dataPath = path.join(__dirname, '../../data/susunkata.json');
    WORDS = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch {
    // Fallback data
    WORDS = [
        { soal: 'gniukc', jawaban: 'kucing' },
        { soal: 'rpmouetk', jawaban: 'komputer' }
    ];
}

module.exports = {
    name: 'susunkata',
    aliases: ['susun', 'scramble', 'acakkata'],
    description: 'Game menyusun kata acak',

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const action = args[0]?.toLowerCase();

            // Start game
            if (!action || action === 'start') {
                if (games.has(chatId)) {
                    const game = games.get(chatId);
                    await sock.sendMessage(chatId, {
                        text: `⚠️ Game masih berlangsung!\n\n🔤 *${game.scrambled.toUpperCase()}*\n\nKetik .susun stop untuk berhenti.`
                    }, { quoted: msg });
                    return;
                }

                // Pick random word
                const item = WORDS[Math.floor(Math.random() * WORDS.length)];
                const scrambled = item.soal || scrambleWord(item.jawaban);

                games.set(chatId, {
                    word: item.jawaban.toLowerCase(),
                    scrambled: scrambled,
                    attempts: 0,
                    startTime: Date.now()
                });

                await sock.sendMessage(chatId, {
                    text: `*🔤 SUSUN KATA*\n\n🔀 *${scrambled.toUpperCase()}*\n\n⏰ Waktu: 60 detik\n💬 Ketik jawaban langsung!`
                }, { quoted: msg });

                // Auto end after 60 seconds
                setTimeout(() => {
                    if (games.has(chatId)) {
                        const game = games.get(chatId);
                        games.delete(chatId);
                        sock.sendMessage(chatId, {
                            text: `⏰ *Waktu Habis!*\n\n🔤 ${game.scrambled.toUpperCase()} = *${game.word.toUpperCase()}*`
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
                    text: `🏳️ *Menyerah!*\n\n🔤 ${game.scrambled.toUpperCase()} = *${game.word.toUpperCase()}*`
                }, { quoted: msg });
                return;
            }

            // Check answer
            if (games.has(chatId)) {
                const game = games.get(chatId);
                const answer = args.join(' ').toLowerCase().trim();
                game.attempts++;

                if (answer === game.word.toLowerCase()) {
                    const time = Math.floor((Date.now() - game.startTime) / 1000);
                    games.delete(chatId);

                    await sock.sendMessage(chatId, {
                        text: `✅ *BENAR!*\n\n🔤 ${game.scrambled.toUpperCase()} = *${game.word.toUpperCase()}*\n\n⏱️ Waktu: ${time} detik\n🔢 Percobaan: ${game.attempts}x`
                    }, { quoted: msg });
                } else if (game.attempts >= 5) {
                    games.delete(chatId);
                    await sock.sendMessage(chatId, {
                        text: `❌ *Percobaan habis!*\n\n🔤 ${game.scrambled.toUpperCase()} = *${game.word.toUpperCase()}*`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `❌ Salah! Sisa percobaan: ${5 - game.attempts}x`
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

function scrambleWord(word) {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}
