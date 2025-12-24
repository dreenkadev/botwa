// dare - random tantangan dare
module.exports = {
    name: 'dare',
    aliases: ['d'],
    description: 'random tantangan dare',

    async execute(sock, msg, { chatId }) {
        try {
            const dares = [
                "kirim chat 'aku kangen kamu' ke kontak terakhir yang kamu chat",
                "post story selfie dengan caption 'aku jomblo dan bangga'",
                "telepon orang random di kontakmu dan bilang 'i love you'",
                "kirim voice note nyanyi lagu anak-anak ke grup ini",
                "screenshot chat terakhirmu dan kirim ke grup",
                "ganti foto profil jadi foto terjelek yang kamu punya selama 1 jam",
                "buat status 'tolong doakan aku segera dapat jodoh'",
                "telepon orang tuamu dan bilang sayang",
                "kirim meme paling cringe ke grup ini",
                "voice note tirukan suara bebek",
                "kirim foto kaki ke grup",
                "kirim chat 'hai' ke 3 orang yang sudah lama ga kamu chat",
                "bikin video 10 detik joget dan kirim ke grup",
                "screenshot home screen hp-mu dan kirim",
                "telepon crush dan tanyakan apa kabar",
                "post story foto masa kecilmu yang memalukan",
                "kirim pesan suara dengan logat daerah lain",
                "mention semua admin dan bilang mereka ganteng/cantik",
                "tulis puisi romantis dan kirim ke grup",
                "kirim chat 'aku mau jujur, aku suka kamu' ke orang random"
            ];

            const random = dares[Math.floor(Math.random() * dares.length)];
            await sock.sendMessage(chatId, { text: `*dare*\n\n${random}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
