const axios = require('axios');

module.exports = {
    name: 'ayat',
    aliases: ['quran', 'alquran'],
    description: 'Get random Quran verse',

    async execute(sock, msg, { chatId, args }) {
        try {
            let surah, ayat;

            if (args.length >= 2) {
                surah = parseInt(args[0]);
                ayat = parseInt(args[1]);
            } else if (args.length === 1) {
                // Random ayat from specific surah
                surah = parseInt(args[0]);
                ayat = null;
            } else {
                // Completely random
                surah = Math.floor(Math.random() * 114) + 1;
                ayat = null;
            }

            // Get surah info first
            const surahResponse = await axios.get(
                `https://api.alquran.cloud/v1/surah/${surah}`,
                { timeout: 10000 }
            );

            const surahData = surahResponse.data?.data;
            if (!surahData) {
                await sock.sendMessage(chatId, {
                    text: 'Surah tidak ditemukan!\n\nGunakan: .ayat <surah> <ayat>\nContoh: .ayat 1 1\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
                return;
            }

            // Get random ayat if not specified
            if (!ayat) {
                ayat = Math.floor(Math.random() * surahData.numberOfAyahs) + 1;
            }

            // Get specific ayat with translation
            const ayatResponse = await axios.get(
                `https://api.alquran.cloud/v1/ayah/${surah}:${ayat}/editions/ar.alafasy,id.indonesian`,
                { timeout: 10000 }
            );

            const editions = ayatResponse.data?.data;
            if (!editions || editions.length < 2) {
                throw new Error('No translation');
            }

            const arabic = editions[0];
            const indonesian = editions[1];

            const text = `📖 *Al-Qur'an*\n\n` +
                `📍 ${surahData.englishName} (${surahData.name})\n` +
                `Surah ${surah} Ayat ${ayat}\n\n` +
                `${arabic.text}\n\n` +
                `*Terjemahan:*\n${indonesian.text}\n\n` +
                `𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'Gagal mengambil ayat. Coba lagi.\n\nGunakan: .ayat <surah> <ayat>\nContoh: .ayat 1 1 (Al-Fatihah ayat 1)\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};
