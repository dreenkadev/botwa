// resi - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'resi',
    aliases: ['track', 'cekresi', 'lacak'],
    description: 'cek resi paket',

    async execute(sock, msg, { chatId, args }) {
        try {
            if (args.length < 2) {
                await sock.sendMessage(chatId, { text: '*resi*\n\n.resi <kurir> <nomor>\nkurir: jne, jnt, sicepat, anteraja, pos, tiki' }, { quoted: msg });
                return;
            }

            const courier = args[0].toLowerCase();
            const awb = args[1];
            const courierMap = { 'jne': 'jne', 'jnt': 'jnt', 'j&t': 'jnt', 'sicepat': 'sicepat', 'anteraja': 'anteraja', 'pos': 'pos', 'tiki': 'tiki' };
            const courierCode = courierMap[courier];

            if (!courierCode) {
                await sock.sendMessage(chatId, { text: 'kurir tidak didukung' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let result = null;

            // api 1: binderbyte
            try {
                const res = await axios.get(`https://api.binderbyte.com/v1/track?api_key=free&courier=${courierCode}&awb=${awb}`, { timeout: 15000 });
                if (res.data?.status === 200 && res.data?.data) {
                    const d = res.data.data;
                    result = { courier: d.summary?.courier || courier, awb, status: d.summary?.status || 'unknown', history: d.history?.slice(0, 3) || [] };
                }
            } catch { }

            // api 2: cekongkir (fallback) 
            if (!result) {
                try {
                    const res = await axios.get(`https://api.lolhuman.xyz/api/cekresi/${courierCode}?apikey=free&resi=${awb}`, { timeout: 15000 });
                    if (res.data?.result) {
                        const r = res.data.result;
                        result = { courier: courier.toUpperCase(), awb, status: r.summary?.status || 'unknown', history: r.manifest?.slice(0, 3) || [] };
                    }
                } catch { }
            }

            await reactDone(sock, msg);

            if (result) {
                let text = `*tracking*\n\nkurir: ${result.courier}\nresi: ${result.awb}\nstatus: ${result.status}`;
                if (result.history?.length > 0) {
                    text += '\n\nriwayat:';
                    result.history.forEach(h => { text += `\n- ${h.date || h.tanggal}: ${h.desc || h.keterangan}`; });
                }
                await sock.sendMessage(chatId, { text }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'tidak ditemukan' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
