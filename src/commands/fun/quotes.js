// quotes - quote motivasi random
module.exports = {
    name: 'quotes',
    aliases: ['motivasi', 'inspire'],
    description: 'quote motivasi',

    async execute(sock, msg, { chatId }) {
        try {
            const quotes = [
                { q: "kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan", a: "colin powell" },
                { q: "jangan pernah menyerah. hari ini keras, besok mungkin lebih buruk, tapi lusa akan cerah", a: "jack ma" },
                { q: "satu-satunya cara untuk melakukan pekerjaan hebat adalah mencintai apa yang kamu lakukan", a: "steve jobs" },
                { q: "kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas", a: "henry ford" },
                { q: "mimpimu tidak punya tanggal kadaluarsa. ambil napas dalam dan coba lagi", a: "unknown" },
                { q: "setiap pencapaian besar dimulai dengan keputusan untuk mencoba", a: "gail devers" },
                { q: "bukan tentang seberapa keras kamu jatuh, tapi seberapa cepat kamu bangkit", a: "rocky balboa" },
                { q: "kepercayaan diri adalah kunci. jika kamu tidak percaya pada diri sendiri, tidak ada yang akan", a: "unknown" },
                { q: "waktu terbaik untuk menanam pohon adalah 20 tahun lalu. waktu terbaik kedua adalah sekarang", a: "pepatah china" },
                { q: "masa depan milik mereka yang percaya pada keindahan impian mereka", a: "eleanor roosevelt" }
            ];

            const random = quotes[Math.floor(Math.random() * quotes.length)];
            await sock.sendMessage(chatId, { text: `*motivasi*\n\n"${random.q}"\n\n- ${random.a}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
