// bucin - kata-kata bucin random
module.exports = {
    name: 'bucin',
    aliases: ['bc'],
    description: 'kata-kata bucin',

    async execute(sock, msg, { chatId }) {
        try {
            const quotes = [
                "aku ga butuh wifi, cukup sinyal dari kamu aja",
                "kamu tau ga bedanya kamu sama matahari? sama-sama bikin aku ga bisa tidur",
                "aku rela jadi konektor listrik, biar kita selalu nyambung",
                "kamu itu kayak google, semua yang aku cari ada di kamu",
                "aku ga takut mati, yang aku takutin kamu sama yang lain",
                "kamu itu kayak charger, selalu ngisi hidupku",
                "hidup tanpa kamu kayak hp tanpa sinyal, ga ada gunanya",
                "aku ga mau jadi pilot, tapi mau landing di hati kamu",
                "kamu kayak password wifi tetangga, susah didapetin",
                "aku ga butuh gps, yang penting jalan hidup sama kamu",
                "kamu itu vitamin, bikin hidupku sehat dan bahagia",
                "kalau kamu jadi air, aku mau jadi ikan biar selalu sama kamu",
                "kamu lebih penting dari kuota internet",
                "setelah ketemu kamu, hidup terasa lebih berwarna",
                "kamu alasan aku bangun pagi dengan senyum"
            ];

            const random = quotes[Math.floor(Math.random() * quotes.length)];
            await sock.sendMessage(chatId, { text: `*bucin*\n\n${random}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
