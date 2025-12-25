// tebakkimia - Game tebak unsur kimia (dengan data lengkap)
const fs = require('fs');
const path = require('path');
const { reactProcessing } = require('../../utils/reaction');

// Game state
const games = new Map();

// Load elements from JSON
let ELEMENTS = [];
try {
    const dataPath = path.join(__dirname, '../../data/tebakkimia.json');
    ELEMENTS = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch {
    // Fallback data
    ELEMENTS = [
        { lambang: 'H', unsur: 'Hidrogen' },
        { lambang: 'O', unsur: 'Oksigen' },
        { lambang: 'C', unsur: 'Karbon' },
        { lambang: 'N', unsur: 'Nitrogen' },
        { lambang: 'Fe', unsur: 'Besi' }
    ];
}

module.exports = {
    name: 'tebakkimia',
    aliases: ['kimia', 'unsur', 'element'],
    description: 'Game tebak unsur kimia',

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const action = args[0]?.toLowerCase();

            // Start game
            if (!action || action === 'start') {
                if (games.has(chatId)) {
                    const game = games.get(chatId);
                    await sock.sendMessage(chatId, {
                        text: `⚠️ Game masih berlangsung!\n\n⚗️ *${game.symbol}*\n\nKetik .kimia stop untuk berhenti.`
                    }, { quoted: msg });
                    return;
                }

                // Pick random element
                const element = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];

                games.set(chatId, {
                    symbol: element.lambang || element.soal,
                    name: (element.unsur || element.jawaban).toLowerCase(),
                    attempts: 0,
                    startTime: Date.now()
                });

                await sock.sendMessage(chatId, {
                    text: `*⚗️ TEBAK UNSUR KIMIA*\n\n🔬 Simbol: *${element.lambang || element.soal}*\n\nApa nama unsur ini?\n\n⏰ Waktu: 60 detik\n💬 Ketik jawaban langsung!`
                }, { quoted: msg });

                // Auto end after 60 seconds
                setTimeout(() => {
                    if (games.has(chatId)) {
                        const game = games.get(chatId);
                        games.delete(chatId);
                        sock.sendMessage(chatId, {
                            text: `⏰ *Waktu Habis!*\n\n⚗️ ${game.symbol} = *${game.name.toUpperCase()}*`
                        });
                    }
                }, 60000);

                return;
            }

            // Stop
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
                    text: `🏳️ *Menyerah!*\n\n⚗️ ${game.symbol} = *${game.name.toUpperCase()}*`
                }, { quoted: msg });
                return;
            }

            // Check answer
            if (games.has(chatId)) {
                const game = games.get(chatId);
                const answer = args.join(' ').toLowerCase().trim();
                game.attempts++;

                if (answer === game.name.toLowerCase() || game.name.includes(answer)) {
                    const time = Math.floor((Date.now() - game.startTime) / 1000);
                    games.delete(chatId);

                    await sock.sendMessage(chatId, {
                        text: `✅ *BENAR!*\n\n⚗️ ${game.symbol} = *${game.name.toUpperCase()}*\n\n⏱️ Waktu: ${time} detik\n🔢 Percobaan: ${game.attempts}x`
                    }, { quoted: msg });
                } else if (game.attempts >= 3) {
                    games.delete(chatId);
                    await sock.sendMessage(chatId, {
                        text: `❌ *Percobaan habis!*\n\n⚗️ ${game.symbol} = *${game.name.toUpperCase()}*`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `❌ Salah! Sisa percobaan: ${3 - game.attempts}x`
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
