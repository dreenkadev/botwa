const axios = require('axios');

const activeGames = new Map();

module.exports = {
    name: 'tebakgambar',
    aliases: ['tg', 'guesspic'],
    description: 'Guess the picture game',

    async execute(sock, msg, { chatId, args, senderId }) {
        // Check if answering
        if (args[0] && args[0].toLowerCase() !== 'start') {
            const game = activeGames.get(chatId);
            if (game && game.active) {
                const userAnswer = args.join(' ').toLowerCase().trim();

                if (userAnswer === game.answer.toLowerCase()) {
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
                        text: `❌ Salah! Coba lagi...\n\nHint: ${game.hint || 'Tidak ada hint'}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                    }, { quoted: msg });
                }
                return;
            }
        }

        // Check if there's an active game
        if (activeGames.has(chatId)) {
            await sock.sendMessage(chatId, {
                text: '⚠️ Masih ada game aktif!\n\nJawab dengan: .tg <jawaban>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        // Start new game
        try {
            // Get random question
            const question = getRandomQuestion();

            activeGames.set(chatId, {
                active: true,
                answer: question.answer,
                hint: question.hint,
                startTime: Date.now()
            });

            // Auto timeout after 60 seconds
            setTimeout(() => {
                const game = activeGames.get(chatId);
                if (game && game.startTime === question.startTime) {
                    activeGames.delete(chatId);
                    sock.sendMessage(chatId, {
                        text: `⏰ *Waktu habis!*\n\nJawaban: ${question.answer}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                    }).catch(() => { });
                }
            }, 60000);

            // Try to get image
            let imageBuffer = null;
            if (question.image) {
                try {
                    const imgRes = await axios.get(question.image, {
                        responseType: 'arraybuffer',
                        timeout: 10000
                    });
                    imageBuffer = Buffer.from(imgRes.data);
                } catch { }
            }

            const caption = `🖼️ *TEBAK GAMBAR!*\n\n` +
                `❓ Tebak gambar di atas!\n` +
                `💡 Hint: ${question.hint}\n` +
                `⏱️ Waktu: 60 detik\n\n` +
                `Jawab dengan: .tg <jawaban>\n\n` +
                `𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            if (imageBuffer) {
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: caption
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: `🖼️ *TEBAK GAMBAR!*\n\n` +
                        `Deskripsi: ${question.description}\n\n` +
                        `💡 Hint: ${question.hint}\n` +
                        `⏱️ Waktu: 60 detik\n\n` +
                        `Jawab dengan: .tg <jawaban>\n\n` +
                        `𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
            }

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: '❌ Gagal memulai game. Coba lagi.\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};

function getRandomQuestion() {
    const questions = [
        { answer: 'kucing', hint: 'Hewan berkaki 4, suka tidur', description: 'Hewan peliharaan yang mengeong' },
        { answer: 'matahari', hint: 'Terbit dari timur', description: 'Benda langit yang menyinari bumi' },
        { answer: 'sepeda', hint: 'Kendaraan roda dua tanpa mesin', description: 'Dikayuh untuk bergerak' },
        { answer: 'komputer', hint: 'Alat elektronik untuk bekerja', description: 'Ada keyboard dan monitor' },
        { answer: 'gitar', hint: 'Alat musik petik', description: 'Punya 6 senar' },
        { answer: 'pizza', hint: 'Makanan dari Italia', description: 'Berbentuk bulat dengan topping' },
        { answer: 'pesawat', hint: 'Kendaraan terbang', description: 'Punya sayap' },
        { answer: 'buku', hint: 'Sumber ilmu pengetahuan', description: 'Kumpulan kertas yang dijilid' },
        { answer: 'jam', hint: 'Menunjukkan waktu', description: 'Ada jarum pendek dan panjang' },
        { answer: 'bulan', hint: 'Terlihat di malam hari', description: 'Satelit alami bumi' },
        { answer: 'apel', hint: 'Buah merah atau hijau', description: 'Logo sebuah brand HP terkenal' },
        { answer: 'kopi', hint: 'Minuman bikin melek', description: 'Warna hitam atau coklat' },
        { answer: 'payung', hint: 'Dipakai saat hujan', description: 'Dipakai di atas kepala' },
        { answer: 'handphone', hint: 'Alat komunikasi genggam', description: 'Smartphone' },
        { answer: 'topi', hint: 'Dipakai di kepala', description: 'Pelindung dari matahari' }
    ];

    const q = questions[Math.floor(Math.random() * questions.length)];
    q.startTime = Date.now();
    return q;
}
