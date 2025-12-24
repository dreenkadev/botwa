// gombal - rayuan gombal random
module.exports = {
    name: 'gombal',
    aliases: ['rayu'],
    description: 'rayuan gombal',

    async execute(sock, msg, { chatId }) {
        try {
            const quotes = [
                "kamu punya peta ga? soalnya aku tersesat di matamu",
                "bapak kamu tukang parkir ya? soalnya kamu parkir terus di hatiku",
                "kamu sakit? soalnya kamu panas banget",
                "kamu tukang pancing ya? karena kamu berhasil mancing hatiku",
                "kamu tukang sulap? tiba-tiba kamu muncul di pikiranku",
                "kamu listrik? soalnya aku kesetrum pas liat kamu",
                "kamu anak petani? karena kamu berhasil menanam cinta di hatiku",
                "tolong jangan deket-deket api, nanti meleleh",
                "bapak kamu atlet lari? soalnya kamu selalu berlari di pikiranku",
                "kamu magnet ya? karena aku selalu tertarik sama kamu",
                "kamu itu cermin, soalnya aku selalu melihat masa depan di matamu",
                "kalau kamu bunga, aku rela jadi lebah",
                "kamu wifi ya? soalnya aku selalu cari sinyal kamu",
                "aku bukan fotografer, tapi aku bisa lihat kita berdua di masa depan",
                "kamu tukang kebun? karena hidupku berbunga sejak kenal kamu"
            ];

            const random = quotes[Math.floor(Math.random() * quotes.length)];
            await sock.sendMessage(chatId, { text: `*gombal*\n\n${random}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
