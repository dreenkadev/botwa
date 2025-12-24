// gempa - dengan fallback sumber
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'gempa',
    aliases: ['earthquake', 'bmkg'],
    description: 'info gempa terbaru',

    async execute(sock, msg, { chatId }) {
        try {
            await reactProcessing(sock, msg);

            let result = null;

            // api 1: bmkg
            try {
                const res = await axios.get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', { timeout: 10000 });
                const g = res.data?.Infogempa?.gempa;
                if (g) result = { tanggal: g.Tanggal, waktu: g.Jam, lokasi: g.Wilayah, magnitudo: g.Magnitude, kedalaman: g.Kedalaman, potensi: g.Potensi };
            } catch { }

            // api 2: usgs (fallback)
            if (!result) {
                try {
                    const res = await axios.get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson', { timeout: 10000 });
                    const eq = res.data?.features?.[0];
                    if (eq) {
                        const p = eq.properties;
                        result = { tanggal: new Date(p.time).toLocaleDateString('id-ID'), waktu: new Date(p.time).toLocaleTimeString('id-ID'), lokasi: p.place, magnitudo: p.mag + ' SR', kedalaman: (eq.geometry.coordinates[2] || 0) + ' km', potensi: p.tsunami ? 'potensi tsunami' : 'tidak berpotensi tsunami' };
                    }
                } catch { }
            }

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, { text: `*gempa*\n\ntanggal: ${result.tanggal}\nwaktu: ${result.waktu}\nlokasi: ${result.lokasi}\nmagnitudo: ${result.magnitudo}\nkedalaman: ${result.kedalaman}\n\n${result.potensi}` }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'data tidak tersedia' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
