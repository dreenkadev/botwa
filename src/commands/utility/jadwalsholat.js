// jadwal sholat - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'jadwalsholat',
    aliases: ['sholat', 'prayer', 'adzan'],
    description: 'jadwal sholat per kota',

    async execute(sock, msg, { chatId, args }) {
        try {
            const city = args.join(' ') || 'jakarta';
            await reactProcessing(sock, msg);

            let result = null;

            // api 1: aladhan via nominatim
            try {
                const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},Indonesia&format=json&limit=1`, { timeout: 8000, headers: { 'User-Agent': 'Bot/1.0' } });
                if (geoRes.data?.[0]) {
                    const { lat, lon, display_name } = geoRes.data[0];
                    const today = new Date();
                    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
                    const prayerRes = await axios.get(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lon}&method=20`, { timeout: 8000 });
                    const t = prayerRes.data?.data?.timings;
                    if (t) result = { city: display_name.split(',')[0], date: today.toLocaleDateString('id-ID'), subuh: t.Fajr, dzuhur: t.Dhuhr, ashar: t.Asr, maghrib: t.Maghrib, isya: t.Isha };
                }
            } catch { }

            // api 2: muslimboard (fallback)
            if (!result) {
                try {
                    const res = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/1301/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${new Date().getDate()}`, { timeout: 8000 });
                    const j = res.data?.data?.jadwal;
                    if (j) result = { city: city, date: j.tanggal, subuh: j.subuh, dzuhur: j.dzuhur, ashar: j.ashar, maghrib: j.maghrib, isya: j.isya };
                } catch { }
            }

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, { text: `*jadwal sholat*\n${result.city}\n${result.date}\n\nsubuh: ${result.subuh}\ndzuhur: ${result.dzuhur}\nashar: ${result.ashar}\nmaghrib: ${result.maghrib}\nisya: ${result.isya}` }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'tidak ditemukan' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
