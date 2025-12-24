// weather - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'weather',
    aliases: ['cuaca'],
    description: 'cek cuaca',

    async execute(sock, msg, { chatId, args }) {
        try {
            const city = args.join(' ') || 'jakarta';
            await reactProcessing(sock, msg);

            let result = null;

            // api 1: wttr.in
            try {
                const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=%l:+%c+%t+%h+%w`, { timeout: 8000 });
                if (res.data && !res.data.includes('Unknown')) result = res.data;
            } catch { }

            // api 2: open-meteo (fallback)
            if (!result) {
                try {
                    const geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`, { timeout: 5000 });
                    if (geo.data?.results?.[0]) {
                        const { latitude, longitude, name } = geo.data.results[0];
                        const weather = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`, { timeout: 5000 });
                        const w = weather.data?.current_weather;
                        if (w) result = `${name}: ${w.temperature}°C, wind ${w.windspeed}km/h`;
                    }
                } catch { }
            }

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, { text: `*cuaca*\n\n${result}` }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'tidak ditemukan' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
