// truth - random pertanyaan truth
module.exports = {
    name: 'truth',
    aliases: ['t'],
    description: 'random pertanyaan truth',

    async execute(sock, msg, { chatId }) {
        try {
            const truths = [
                "apa rahasia terbesar yang ga pernah kamu ceritakan?",
                "siapa orang yang paling sering kamu stalking di sosmed?",
                "apa kebohongan terbesar yang pernah kamu katakan?",
                "siapa crush pertamamu?",
                "apa hal paling memalukan yang pernah terjadi?",
                "kalau bisa menghapus satu memori, memori apa?",
                "apa kebiasaan burukmu yang ga ada yang tau?",
                "siapa di grup ini yang menurutmu paling menarik?",
                "apa yang kamu lakukan pertama kali saat bangun tidur?",
                "pernahkah kamu berbohong ke orang tua? tentang apa?",
                "apa hal terbodoh yang pernah kamu lakukan karena cinta?",
                "siapa mantan yang masih kamu stalking?",
                "apa impian terpendam yang malu kamu ceritakan?",
                "apa ketakutan terbesarmu?",
                "pernahkah kamu mencuri? apa yang kamu curi?",
                "apa hal yang paling kamu sesali di hidupmu?",
                "siapa orang yang diam-diam kamu benci tapi pura-pura baik?",
                "kalau besok dunia kiamat, apa yang akan kamu lakukan hari ini?",
                "siapa yang kamu anggap teman tapi sebenarnya kamu ga suka?",
                "apa hal paling aneh yang kamu lakukan sendirian?"
            ];

            const random = truths[Math.floor(Math.random() * truths.length)];
            await sock.sendMessage(chatId, { text: `*truth*\n\n${random}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
