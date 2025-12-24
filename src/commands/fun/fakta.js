// fakta - fakta menarik random
module.exports = {
    name: 'fakta',
    aliases: ['fact', 'facts'],
    description: 'fakta menarik',

    async execute(sock, msg, { chatId }) {
        try {
            const facts = [
                "madu tidak pernah basi, madu yang ditemukan di makam mesir kuno masih bisa dimakan",
                "gurita punya 3 jantung dan darahnya berwarna biru",
                "pisang termasuk berry, tapi strawberry bukan",
                "satu petir memiliki energi yang cukup untuk memanggang 100.000 roti",
                "kucing tidak bisa merasakan rasa manis",
                "semut tidak punya paru-paru",
                "lebah bisa mengenali wajah manusia",
                "lumba-lumba tidur dengan satu mata terbuka",
                "otak manusia lebih aktif saat tidur daripada saat menonton tv",
                "sidik jari kuala sangat mirip dengan manusia",
                "kecoa bisa hidup beberapa minggu tanpa kepala",
                "gajah adalah satu-satunya hewan yang tidak bisa melompat",
                "jantung udang terletak di kepalanya",
                "kupu-kupu mencicipi makanan dengan kakinya",
                "astronot menjadi lebih tinggi di luar angkasa"
            ];

            const random = facts[Math.floor(Math.random() * facts.length)];
            await sock.sendMessage(chatId, { text: `*fakta*\n\n${random}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
