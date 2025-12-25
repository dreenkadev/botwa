// menuinfo command - penjelasan singkat tiap command (UPDATED)
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
    'time': 'waktu berbagai negara',
    'mi': 'info singkat tentang command',

    // media - downloaders
    'tt': 'download video/audio TikTok (support HD & slideshow)',
    'ig': 'download post instagram',
    'ytmp4': 'download video youtube',
    'ytmp3': 'download audio youtube',
    'spotify': 'download lagu spotify',
    'twitter': 'download video twitter/x',
    'facebook': 'download video facebook',
    'pinterest': 'download gambar pinterest',
    'pinalbum': 'download multiple gambar pinterest',
    'mediafire': 'download file dari mediafire',
    'snackvideo': 'download video snack video',
    'ttsearch': 'search video tiktok by keyword',

    // media - edit
    'sticker': 'buat sticker dari gambar',
    'toimg': 'convert sticker ke gambar',
    'imagine': 'generate gambar ai (12 styles)',
    'removebg': 'hapus background gambar',
    'remini': 'AI enhance gambar (upscale/recolor/dehaze)',
    'pxpic': 'image tools (removebg/enhance/upscale/restore/colorize)',
    'ephoto': 'text effect generator (17 templates)',
    'banana': 'transform style gambar dengan AI (img2img)',
    'img2video': 'convert gambar ke video AI',
    'mirror': 'flip gambar horizontal',
    'rotate': 'putar gambar 90/180/270',
    'resize': 'ubah ukuran gambar',
    'blur': 'blur effect pada gambar',
    'greyscale': 'hitam putih gambar',
    'invert': 'invert warna gambar',
    'pixelate': 'pixelate effect gambar',

    // media - audio
    'bass': 'bass boost audio',
    'slow': 'slow effect audio',
    'nightcore': 'nightcore effect audio',
    'mp3': 'convert video ke audio',
    'voicecover': 'AI voice cover (Miku, Ariana Grande, dll)',

    // ai
    'ai': 'chat dengan ai',
    'code': 'generate code dengan ai',
    'aivideo': 'generate video dari text prompt (Veo3 style)',
    'elevenlabs': 'ElevenLabs AI text-to-speech',
    'shion': 'chat dengan Shion AI (roleplay)',
    'songgenerator': 'generate lagu dengan AI',

    // fun - games
    'family100': 'game family 100 (ratusan soal)',
    'tebakgambar': 'game tebak gambar (1000+ soal)',
    'tebakbendera': 'game tebak bendera negara',
    'tebakkata': 'game tebak kata dari definisi',
    'tebakkimia': 'game tebak unsur kimia',
    'susunkata': 'game susun kata acak',
    'asahotak': 'game teka-teki asah otak',
    'slot': 'main slot machine',
    'roll': 'roll dadu',
    'suit': 'main suit batu gunting kertas',
    'fishing': 'main mancing virtual',
    'math': 'quiz matematika',
    '8ball': 'magic 8 ball',
    'growagarden': 'info game Grow a Garden (Roblox)',

    // fun - economy
    'daily': 'claim reward harian',
    'balance': 'cek saldo coins',
    'transfer': 'transfer coins ke user',
    'lb': 'leaderboard user aktif',

    // fun - random
    'truth': 'random pertanyaan truth',
    'dare': 'random tantangan dare',
    'bucin': 'kata-kata bucin',
    'gombal': 'rayuan gombal',
    'fakta': 'fakta random',
    'quotes': 'quote motivasi',
    'ship': 'match percentage 2 orang',
    'simi': 'chat dengan simsimi',
    'waifu': 'random gambar waifu',
    'neko': 'random gambar kucing',
    'anime': 'info anime',
    'lyric': 'cari lirik lagu',
    'movie': 'info film',
    'news': 'berita terkini',
    'brat': 'buat sticker brat',
    'wasted': 'efek wasted GTA',
    'triggered': 'efek triggered',

    // utility
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
    'encb64': 'encode ke base64',
    'decb64': 'decode dari base64',
    'remind': 'set reminder',

    // group
    'kick': 'kick member dari grup',
    'add': 'add member ke grup',
    'promote': 'promote jadi admin',
    'demote': 'demote dari admin',
    'hidetag': 'tag all tanpa mention',
    'tagall': 'tag semua member',
    'mute': 'mute grup',
    'unmute': 'unmute grup',
    'linkgroup': 'get link grup',
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
    'mode': 'ganti mode bot public/self',
    'public': 'mode publik',
    'self': 'mode self only',
    'autostory': 'auto post ke status WA (jadwal/repeat)',
    'setspecial': 'set pesan khusus untuk special contact',

    // rental system
    'sewa': 'lihat harga sewa bot',
    'masa': 'cek sisa masa sewa',
    'addsewa': 'tambah/perpanjang sewa (owner)',
    'listsewa': 'list semua customer sewa (owner)',
    'setsewa': 'atur harga dan payment info (owner)'
};

module.exports = {
    name: 'menuinfo',
    aliases: ['mi', 'cmdinfo', 'ci'],
    description: 'info singkat tentang command (155+ commands)',

    async execute(sock, msg, { chatId, args }) {
        try {
            const cmd = args[0]?.toLowerCase();

            if (!cmd) {
                const categories = {
                    'Media': 'tt, ig, ytmp4, remini, ephoto, pxpic, voicecover',
                    'AI': 'ai, aivideo, banana, elevenlabs, shion, songgenerator',
                    'Games': 'family100, tebakgambar, tebakbendera, susunkata, asahotak',
                    'Fun': 'slot, fishing, truth, dare, waifu, brat',
                    'Utility': 'translate, weather, calc, qr, remind',
                    'Group': 'kick, promote, tagall, antilink, warn'
                };

                let text = `*📖 COMMAND INFO*\n\nKetik: .mi <command>\nContoh: .mi tt\n\n*📂 Kategori:*`;
                for (const [cat, cmds] of Object.entries(categories)) {
                    text += `\n• ${cat}: ${cmds}`;
                }
                text += `\n\n*Total: 146+ commands!*`;

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            const info = commandInfo[cmd];

            if (!info) {
                await sock.sendMessage(chatId, {
                    text: `❌ Command "${cmd}" tidak ditemukan\n\nKetik .menu untuk list command`
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                text: `*📌 .${cmd}*\n\n${info}`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: '❌ Gagal memuat info command'
            }, { quoted: msg });
        }
    }
};
