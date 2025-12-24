module.exports = {
    name: 'doaharian',
    aliases: ['doa', 'duaa'],
    description: 'Collection of daily prayers',

    async execute(sock, msg, { chatId, args }) {
        const doas = {
            'bangun': {
                title: 'Doa Bangun Tidur',
                arab: 'اَلْحَمْدُ ِللهِ الَّذِىْ اَحْيَانَا بَعْدَ مَا اَمَاتَنَا وَاِلَيْهِ النُّشُوْرُ',
                latin: "Alhamdulillahilladzii ahyaanaa ba'da maa amaatanaa wa ilaihin nusyuur",
                arti: 'Segala puji bagi Allah yang telah menghidupkan kami sesudah kami mati dan hanya kepada-Nya kami dikembalikan.'
            },
            'tidur': {
                title: 'Doa Sebelum Tidur',
                arab: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
                latin: 'Bismikallaahumma amuutu wa ahyaa',
                arti: 'Dengan menyebut nama-Mu ya Allah, aku mati dan aku hidup.'
            },
            'makan': {
                title: 'Doa Sebelum Makan',
                arab: 'اَللَّهُمَّ بَارِكْ لَنَا فِيْمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
                latin: 'Allahumma baarik lanaa fiimaa razaqtanaa wa qinaa adzaaban naar',
                arti: 'Ya Allah, berkahilah kami dalam rezeki yang telah Engkau berikan kepada kami dan peliharalah kami dari siksa api neraka.'
            },
            'setelahmakan': {
                title: 'Doa Setelah Makan',
                arab: 'اَلْحَمْدُ ِللهِ الَّذِىْ اَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِيْنَ',
                latin: "Alhamdulillaahilladzii ath'amanaa wa saqaanaa wa ja'alanaa muslimiin",
                arti: 'Segala puji bagi Allah yang telah memberi kami makan dan minum, serta menjadikan kami sebagai orang-orang Islam.'
            },
            'bepergian': {
                title: 'Doa Bepergian',
                arab: 'سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُوْنَ',
                latin: 'Subhanalladzi sakhkhara lanaa haadzaa wa maa kunnaa lahuu muqriniin wa innaa ilaa rabbinaa lamunqalibuun',
                arti: 'Maha Suci Allah yang telah menundukkan semua ini bagi kami padahal kami sebelumnya tidak mampu menguasainya. Dan sesungguhnya kami akan kembali kepada Tuhan kami.'
            },
            'masukrumah': {
                title: 'Doa Masuk Rumah',
                arab: 'اَللَّهُمَّ إِنِّى أَسْأَلُكَ خَيْرَ الْمَوْلِجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللهِ وَلَجْنَا وَبِسْمِ اللهِ خَرَجْنَا وَعَلَى اللهِ رَبِّنَا تَوَكَّلْنَا',
                latin: "Allahumma innii as'aluka khoirol mauliji wa khoirol makhroji, bismillahi walajnaa wa bismillahi kharajnaa wa 'alallahi rabbinaa tawakkalnaa",
                arti: 'Ya Allah, sesungguhnya aku mohon kepada-Mu baiknya tempat masuk dan baiknya tempat keluar. Dengan nama Allah kami masuk, dan dengan nama Allah kami keluar, dan kepada Allah Tuhan kami, kami bertawakal.'
            },
            'keluarrumah': {
                title: 'Doa Keluar Rumah',
                arab: 'بِسْمِ اللهِ تَوَكَّلْتُ عَلىَ اللهِ لاَحَوْلَ وَلاَقُوَّةَ اِلاَّ بِاللهِ',
                latin: "Bismillahi tawakkaltu 'alallahi laa haula wa laa quwwata illaa billah",
                arti: 'Dengan nama Allah aku bertawakal kepada Allah, tidak ada daya dan kekuatan kecuali dengan pertolongan Allah.'
            },
            'wudhu': {
                title: 'Doa Setelah Wudhu',
                arab: 'أَشْهَدُ أَنْ لاَ إِلَـهَ إِلاَّ اللهُ وَحْدَهُ لاَ شَرِيْكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُوْلُهُ',
                latin: "Asyhadu allaa ilaaha illallahu wahdahu laa syariika lahu wa asyhadu anna muhammadan 'abduhu wa rasuuluh",
                arti: 'Aku bersaksi bahwa tidak ada Tuhan selain Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Dan aku bersaksi bahwa Muhammad adalah hamba dan utusan-Nya.'
            }
        };

        const keyword = args[0]?.toLowerCase();

        if (!keyword || !doas[keyword]) {
            const list = Object.keys(doas).join(', ');
            await sock.sendMessage(chatId, {
                text: `🤲 *Doa Harian*\n\nUsage: .doa <jenis>\n\nJenis doa:\n${list}\n\nContoh: .doa bangun\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
            return;
        }

        const doa = doas[keyword];

        await sock.sendMessage(chatId, {
            text: `🤲 *${doa.title}*\n\n` +
                `${doa.arab}\n\n` +
                `_${doa.latin}_\n\n` +
                `*Artinya:*\n${doa.arti}\n\n` +
                `𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
        }, { quoted: msg });
    }
};
