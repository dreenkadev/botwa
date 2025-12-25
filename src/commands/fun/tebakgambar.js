// tebakgambar - Game tebak gambar (dengan data lengkap dari JSON)
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const activeGames = new Map();

// Load questions from JSON  
let QUESTIONS = [];
try {
    const dataPath = path.join(__dirname, '../../data/tebakgambar.json');
    QUESTIONS = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch {
    // Fallback data
    QUESTIONS = [
        { img: '', jawaban: 'KUCING', deskripsi: 'Hewan peliharaan yang mengeong' }
    ];
}

module.exports = {
    name: 'tebakgambar',
    aliases: ['tg', 'guesspic'],
    description: 'Game tebak gambar (1000+ soal)',

    async execute(sock, msg, { chatId, args, senderId }) {
        const action = args[0]?.toLowerCase();

        // Stop game
        if (action === 'stop' || action === 'nyerah') {
            const game = activeGames.get(chatId);
            if (game) {
                activeGames.delete(chatId);
                await sock.sendMessage(chatId, {
                    text: `🏳️ *Menyerah!*\n\n✅ Jawaban: *${game.answer}*\n📝 ${game.description}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Tidak ada game yang berlangsung.'
                }, { quoted: msg });
            }
            return;
        }

        // Check if answering
        if (action && action !== 'start') {
            const game = activeGames.get(chatId);
            if (game && game.active) {
                const userAnswer = args.join(' ').toUpperCase().trim();

                if (userAnswer === game.answer.toUpperCase()) {
                    const time = ((Date.now() - game.startTime) / 1000).toFixed(1);
                    activeGames.delete(chatId);

                    await sock.sendMessage(chatId, {
                        text: `✅ *BENAR!*\n\n🎯 Jawaban: *${game.answer}*\n📝 ${game.description}\n⏱️ Waktu: ${time} detik`,
                        mentions: [`${senderId}@s.whatsapp.net`]
                    }, { quoted: msg });
                } else {
                    const hint = getHint(game.answer);
                    await sock.sendMessage(chatId, {
                        text: `❌ Salah! Coba lagi...\n\n💡 Hint: ${hint}`
                    }, { quoted: msg });
                }
                return;
            }
        }

        // Check if there's an active game
        if (activeGames.has(chatId)) {
            const game = activeGames.get(chatId);
            const hint = getHint(game.answer);
            await sock.sendMessage(chatId, {
                text: `⚠️ Masih ada game aktif!\n\n💡 Hint: ${hint}\n\nJawab dengan: .tg <jawaban>\nMenyerah: .tg nyerah`
            }, { quoted: msg });
            return;
        }

        // Start new game
        try {
            // Get random question
            const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

            activeGames.set(chatId, {
                active: true,
                answer: question.jawaban,
                description: question.deskripsi || '',
                imageUrl: question.img,
                startTime: Date.now()
            });

            // Auto timeout after 90 seconds
            const startTime = Date.now();
            setTimeout(() => {
                const game = activeGames.get(chatId);
                if (game && game.startTime === startTime) {
                    activeGames.delete(chatId);
                    sock.sendMessage(chatId, {
                        text: `⏰ *Waktu habis!*\n\n✅ Jawaban: *${question.jawaban}*\n📝 ${question.deskripsi || ''}`
                    }).catch(() => { });
                }
            }, 90000);

            // Try to get image
            let imageBuffer = null;
            if (question.img) {
                try {
                    const imgRes = await axios.get(question.img, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });
                    imageBuffer = Buffer.from(imgRes.data);
                } catch { }
            }

            const hint = getHint(question.jawaban);
            const caption = `🖼️ *TEBAK GAMBAR!*\n\n❓ Tebak gambar di atas!\n💡 Hint: ${hint}\n⏱️ Waktu: 90 detik\n\nJawab dengan: .tg <jawaban>\nMenyerah: .tg nyerah`;

            if (imageBuffer) {
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: caption
                }, { quoted: msg });
            } else {
                // If image fails, send description instead
                await sock.sendMessage(chatId, {
                    text: `🖼️ *TEBAK GAMBAR!*\n\n📝 Deskripsi: ${question.deskripsi}\n\n💡 Hint: ${hint}\n⏱️ Waktu: 90 detik\n\nJawab dengan: .tg <jawaban>\nMenyerah: .tg nyerah`
                }, { quoted: msg });
            }

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: '❌ Gagal memulai game. Coba lagi.'
            }, { quoted: msg });
        }
    }
};

function getHint(answer) {
    const words = answer.split(' ');
    return words.map(word => {
        if (word.length <= 2) return word;
        return word[0] + '_'.repeat(word.length - 2) + word[word.length - 1];
    }).join(' ') + ` (${answer.length} karakter)`;
}
