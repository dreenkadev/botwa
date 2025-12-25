# 📖 DreenkaBot-WA Command Guide
## Panduan Lengkap Penggunaan Semua Command

**Prefix:** `.` (titik)
**Owner:** @Dreenka

---

## 📋 DAFTAR KATEGORI

1. [GENERAL](#-general) - Command umum
2. [OWNER](#-owner) - Khusus pemilik bot
3. [GROUP](#-group) - Fitur grup
4. [MODERATION](#-moderation) - Moderasi grup
5. [MEDIA](#-media) - Download & edit media
6. [UTILITY](#-utility) - Tools berguna
7. [FUN](#-fun) - Hiburan & game
8. [AI](#-ai) - Kecerdasan buatan

---

## 🏠 GENERAL

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.menu` / `.m` | Tampilkan daftar semua command | `.menu` |
| `.help <cmd>` / `.mi` | Info detail tentang command | `.help ping` |
| `.bot` / `.info` | Info tentang bot | `.bot` |
| `.ping` | Cek response time bot | `.ping` |
| `.owner` | Info owner bot | `.owner` |
| `.stats` | Statistik penggunaan bot | `.stats` |
| `.time` | Tampilkan waktu berbagai zona | `.time` |

---

## 👑 OWNER

> **Khusus Owner Bot Only!**

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.public` | Mode publik (semua bisa pakai) | `.public` |
| `.self` | Mode self (hanya owner) | `.self` |
| `.setprefix <char>` | Ubah prefix bot | `.setprefix !` |
| `.broadcast <msg>` | Kirim pesan ke semua grup | `.broadcast Halo semua!` |
| `.dm <nomor> <msg>` | Kirim DM ke nomor | `.dm 628xxx Halo` |
| `.addprem <nomor>` | Tambah user premium | `.addprem 628xxx` |
| `.delprem <nomor>` | Hapus user premium | `.delprem 628xxx` |
| `.listprem` | Lihat daftar premium | `.listprem` |
| `.backup` | Backup data bot | `.backup` |
| `.clearcache` | Bersihkan cache | `.clearcache` |
| `.runtime` | Lihat uptime bot | `.runtime` |
| `.server` | Info server | `.server` |
| `.shutdown` | Matikan bot | `.shutdown` |

---

## 👥 GROUP

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.groupinfo` | Info grup | `.groupinfo` |
| `.linkgroup` | Dapatkan link grup | `.linkgroup` |
| `.listadmin` | Daftar admin grup | `.listadmin` |
| `.tagall` | Tag semua member | `.tagall` |
| `.hidetag <msg>` | Tag semua tanpa terlihat | `.hidetag Pengumuman!` |
| `.poll <q> <opt>` | Buat polling | `.poll "Setuju?" "Ya" "Tidak"` |
| `.rules` | Lihat/set aturan grup | `.rules` |
| `.setgroupname <nama>` | Ubah nama grup | `.setgroupname Grup Baru` |
| `.setgroupdesc <desc>` | Ubah deskripsi grup | `.setgroupdesc Deskripsi baru` |
| `.welcome on/off` | Toggle welcome message | `.welcome on` |
| `.autoresponse` | Auto response setting | `.autoresponse` |
| `.confess <msg>` | Kirim pesan anonim | `.confess Hai admin` |
| `.report` | Laporkan ke admin | `.report` |
| `.mute` | Mute grup | `.mute` |
| `.unmute` | Unmute grup | `.unmute` |
| `.revoke` | Reset link grup | `.revoke` |

---

## 🛡️ MODERATION

> **Admin Only!**

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.kick @user` | Keluarkan member | `.kick @user` (reply) |
| `.promote @user` | Jadikan admin | `.promote @user` |
| `.demote @user` | Turunkan dari admin | `.demote @user` |
| `.warn @user` | Beri warning | `.warn @user` |
| `.antilink on/off` | Anti link grup lain | `.antilink on` |
| `.antispam on/off` | Anti spam | `.antispam on` |
| `.toxicfilter on/off` | Filter kata kasar | `.toxicfilter on` |
| `.antiviewonce on/off` | Bypass view once | `.antiviewonce on` |

---

## 🎬 MEDIA

### Download

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.tt <url>` | Download TikTok | `.tt https://vm.tiktok.com/xxx` |
| `.tt <url> -a` | Download TikTok audio | `.tt https://vm.tiktok.com/xxx -a` |
| `.ig <url>` | Download Instagram | `.ig https://instagram.com/p/xxx` |
| `.ytmp4 <url>` | Download YouTube video | `.ytmp4 https://youtu.be/xxx` |
| `.ytmp3 <url>` | Download YouTube audio | `.ytmp3 https://youtu.be/xxx` |
| `.facebook <url>` | Download Facebook | `.facebook https://fb.watch/xxx` |
| `.twitter <url>` | Download Twitter/X | `.twitter https://x.com/xxx` |
| `.spotify <url>` | Download Spotify | `.spotify https://open.spotify.com/xxx` |
| `.pinterest <query>` | Cari gambar Pinterest | `.pinterest anime aesthetic` |

### Edit Media

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.sticker` | Ubah gambar/video jadi sticker | Reply gambar + `.sticker` |
| `.toimg` | Ubah sticker jadi gambar | Reply sticker + `.toimg` |
| `.blur` | Blur gambar | Reply gambar + `.blur` |
| `.greyscale` | Hitam putih | Reply gambar + `.greyscale` |
| `.invert` | Invert warna | Reply gambar + `.invert` |
| `.mirror` | Mirror gambar | Reply gambar + `.mirror` |
| `.pixelate` | Pixelate gambar | Reply gambar + `.pixelate` |
| `.rotate <deg>` | Putar gambar | Reply + `.rotate 90` |
| `.resize <w> <h>` | Resize gambar | Reply + `.resize 500 500` |
| `.removebg` | Hapus background | Reply gambar + `.removebg` |
| `.imagine <prompt>` | Generate gambar AI | `.imagine sunset beach` |

### Audio Effect

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.bass` | Tambah bass audio | Reply audio + `.bass` |
| `.slow` | Slow motion audio | Reply audio + `.slow` |
| `.nightcore` | Efek nightcore | Reply audio + `.nightcore` |
| `.mp3` | Convert video ke audio | Reply video + `.mp3` |

---

## 🔧 UTILITY

### Teks & Bahasa

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.translate <lang> <text>` | Terjemahkan teks | `.translate en Halo dunia` |
| `.tts <text>` | Text to speech | `.tts Halo semua` |
| `.define <word>` | Definisi kata (EN) | `.define happy` |
| `.kbbi <kata>` | Definisi kata (ID) | `.kbbi belajar` |
| `.wiki <query>` | Cari Wikipedia | `.wiki Indonesia` |

### Encode/Decode

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.encb64 <text>` | Encode Base64 | `.encb64 hello` |
| `.decb64 <text>` | Decode Base64 | `.decb64 aGVsbG8=` |
| `.qr <text>` | Buat QR code | `.qr https://example.com` |

### Informasi

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.weather <kota>` | Cek cuaca | `.weather Jakarta` |
| `.gempa` | Info gempa terkini | `.gempa` |
| `.kurs <from> <to>` | Konversi mata uang | `.kurs usd idr` |
| `.crypto <coin>` | Harga crypto | `.crypto btc` |
| `.github <user>` | Info profil GitHub | `.github dreenkadev` |
| `.ip <address>` | Lookup IP address | `.ip 8.8.8.8` |

### Islam

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.ayat <surah>:<ayat>` | Baca ayat Al-Quran | `.ayat 1:1` |
| `.jadwalsholat <kota>` | Jadwal sholat | `.jadwalsholat Jakarta` |
| `.doaharian <jenis>` | Doa harian | `.doaharian bangun` |

### Tools

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.calc <expr>` | Kalkulator | `.calc 5+5*2` |
| `.rumus <jenis>` | Rumus matematika | `.rumus luas_lingkaran` |
| `.short <url>` | Persingkat URL | `.short https://example.com/xxx` |
| `.screenshot <url>` | Screenshot website | `.screenshot https://google.com` |
| `.ongkir <asal> <tujuan> <berat>` | Cek ongkir | `.ongkir jakarta bandung 1000` |
| `.resi <kurir> <resi>` | Lacak paket | `.resi jne 123456` |

### Reminder

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.remind <waktu> <msg>` | Set reminder | `.remind 10m Makan siang` |
| `.timer <waktu>` | Timer countdown | `.timer 5m` |
| `.schedule <waktu> <msg>` | Jadwalkan pesan | `.schedule 1h Meeting!` |
| `.afk <alasan>` | Set status AFK | `.afk makan dulu` |
| `.note add <text>` | Simpan catatan | `.note add Beli susu` |
| `.note list` | Lihat catatan | `.note list` |

---

## 🎮 FUN

### Games

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.slot` | Main slot machine | `.slot` |
| `.roll` | Roll dadu | `.roll` |
| `.8ball <question>` | Magic 8 ball | `.8ball Apakah aku ganteng?` |
| `.suit <pilihan>` | Suit (batu kertas gunting) | `.suit batu` |
| `.math` | Quiz matematika | `.math` |
| `.tebakgambar` | Game tebak gambar | `.tebakgambar` |
| `.fishing` | Mancing virtual | `.fishing` |

### Economy

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.balance` | Cek saldo coins | `.balance` |
| `.daily` | Klaim bonus harian | `.daily` |
| `.transfer @user <amt>` | Kirim coins | `.transfer @user 1000` |
| `.leaderboard` | Ranking terkaya | `.leaderboard` |

### Random

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.quotes` | Quote random | `.quotes` |
| `.fakta` | Fakta random | `.fakta` |
| `.gombal` | Kata gombal | `.gombal` |
| `.bucin` | Kata bucin | `.bucin` |
| `.truth` | Truth or dare (truth) | `.truth` |
| `.dare` | Truth or dare (dare) | `.dare` |
| `.ship @user1 @user2` | Match percentage | `.ship @a @b` |

### Media Fun

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.brat <text>` | Buat sticker brat | `.brat Hello World` |
| `.wasted` | Efek wasted GTA | Reply foto + `.wasted` |
| `.triggered` | Efek triggered | Reply foto + `.triggered` |
| `.waifu` | Random waifu | `.waifu` |
| `.neko` | Random neko | `.neko` |
| `.anime <query>` | Cari info anime | `.anime naruto` |
| `.lyric <song>` | Cari lirik lagu | `.lyric someone like you` |
| `.movie <title>` | Info film | `.movie avengers` |
| `.news` | Berita terkini | `.news` |
| `.simi <chat>` | Chat dengan SimSimi | `.simi Hai` |

---

## 🤖 AI

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `.ai <prompt>` | Chat dengan AI | `.ai Apa itu coding?` |
| `.code <lang> <desc>` | Generate code | `.code python hello world` |

---

## 💡 TIPS PENGGUNAAN

1. **Reply Message** - Beberapa command bisa digunakan dengan reply pesan:
   - `.sticker` (reply gambar)
   - `.translate` (reply teks)
   - `.tts` (reply teks)

2. **Media Download** - Untuk download, paste langsung URL:
   - `.tt <url>` - TikTok
   - `.ig <url>` - Instagram
   - `.ytmp4 <url>` - YouTube

3. **Grup Commands** - Harus digunakan di dalam grup:
   - `.tagall`, `.kick`, `.promote`, dll

4. **Audio Flag** - Tambah `-a` untuk download audio only:
   - `.tt <url> -a`
   - `.ig <url> -a`

---

## 🔗 SOSIAL MEDIA OWNER

- 📸 Instagram: instagram.com/dreevx_/
- 💻 GitHub: github.com/dreenkadev
- 🌐 Portfolio: dreenka.vercel.app
- 👤 GDev: dreenka

---

**© 2024 DreenkaBot-WA by DreenkaDev**
