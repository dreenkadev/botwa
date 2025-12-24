// menuinfo command - penjelasan singkat tiap command
const fs = require('fs');
const path = require('path');

const commandInfo = {
    // general
    'bot': 'tampilkan info bot dengan gambar',
    'menu': 'list semua command',
    'ping': 'cek response time bot',
    'help': 'bantuan penggunaan bot',
    'owner': 'info owner bot',
    'stats': 'statistik bot',

    // media
    'tt': 'download video tiktok',
    'ig': 'download post instagram',
    'yt': 'download video youtube',
    'ytmp3': 'download audio youtube',
    'spotify': 'download lagu spotify',
    'twitter': 'download video twitter/x',
    'fb': 'download video facebook',
    'pinterest': 'download gambar pinterest',
    'sticker': 'buat sticker dari gambar',
    'toimg': 'convert sticker ke gambar',
    'imagine': 'generate gambar ai',
    'removebg': 'hapus background gambar',
    'mirror': 'flip gambar horizontal',
    'rotate': 'putar gambar 90/180/270',
    'resize': 'ubah ukuran gambar',
    'bass': 'bass boost audio',
    'slow': 'slow effect audio',
    'nightcore': 'nightcore effect audio',

    // fun
    'truth': 'random pertanyaan truth',
    'dare': 'random tantangan dare',
    'suit': 'main suit batu gunting kertas',
    'slot': 'main slot machine',
    'fishing': 'main mancing',
    'math': 'quiz matematika',
    'tg': 'game tebak gambar',
    'daily': 'claim reward harian',
    'balance': 'cek saldo coins',
    'transfer': 'transfer coins ke user',
    'lb': 'leaderboard user aktif',
    'simi': 'chat dengan simsimi',
    'waifu': 'random gambar waifu',
    'neko': 'random gambar kucing',
    'bucin': 'kata-kata bucin',
    'gombal': 'rayuan gombal',
    'fakta': 'fakta random',
    'quotes': 'quote motivasi',

    // utility
    'ai': 'chat dengan ai',
    'code': 'generate code dengan ai',
    'translate': 'terjemahkan text',
    'tts': 'text to speech',
    'weather': 'info cuaca',
    'kbbi': 'cari di kamus besar',
    'crypto': 'harga cryptocurrency',
    'kurs': 'kurs mata uang',
    'resi': 'cek resi paket',
    'ongkir': 'cek ongkos kirim',
    'gempa': 'info gempa terbaru',
    'sholat': 'jadwal sholat',
    'ayat': 'random ayat quran',
    'doa': 'doa harian',
    'rumus': 'rumus matematika/fisika',
    'afk': 'set status afk',
    'note': 'simpan catatan',
    'timer': 'set countdown timer',
    'schedule': 'jadwalkan pesan',
    'calc': 'kalkulator',
    'qr': 'buat qr code',

    // group
    'kick': 'kick member dari grup',
    'add': 'add member ke grup',
    'promote': 'promote jadi admin',
    'demote': 'demote dari admin',
    'hidetag': 'tag all tanpa mention',
    'mute': 'mute grup',
    'unmute': 'unmute grup',
    'link': 'get link grup',
    'revoke': 'revoke link grup',
    'rules': 'set/lihat rules grup',
    'groupinfo': 'info lengkap grup',
    'listadmin': 'list admin grup',
    'ar': 'auto response keyword',
    'confess': 'kirim pesan anonim ke admin',
    'report': 'report user ke admin',
    'welcome': 'set pesan welcome',
    'poll': 'buat polling',

    // moderation
    'antilink': 'aktifkan antilink',
    'antitoxic': 'aktifkan antitoxic',
    'antispam': 'aktifkan antispam',
    'warn': 'warn member',
    'unwarn': 'hapus warn',
    'warnlist': 'list warned users',
    'ban': 'blacklist user',
    'unban': 'unblacklist user',

    // owner
    'addprem': 'tambah premium user',
    'delprem': 'hapus premium user',
    'listprem': 'list premium users',
    'runtime': 'uptime bot',
    'server': 'status server',
    'dm': 'kirim dm via bot',
    'broadcast': 'broadcast ke semua chat',
    'setpp': 'ganti foto bot',
    'setbio': 'ganti bio bot',
    'mode': 'ganti mode bot public/self'
};

module.exports = {
    name: 'menuinfo',
    aliases: ['mi', 'cmdinfo', 'ci'],
    description: 'info singkat tentang command',

    async execute(sock, msg, { chatId, args }) {
        try {
            const cmd = args[0]?.toLowerCase();

            if (!cmd) {
                await sock.sendMessage(chatId, {
                    text: `*command info*

ketik: .mi <nama command>
contoh: .mi tt

untuk melihat penjelasan singkat dari command`
                }, { quoted: msg });
                return;
            }

            const info = commandInfo[cmd];

            if (!info) {
                await sock.sendMessage(chatId, {
                    text: `command "${cmd}" tidak ditemukan

ketik .menu untuk list command`
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                text: `*${cmd}*\n${info}`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'gagal memuat info command'
            }, { quoted: msg });
        }
    }
};
