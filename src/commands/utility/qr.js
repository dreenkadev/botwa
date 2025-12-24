// qr - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'qr',
    aliases: ['qrcode'],
    description: 'generate qr code',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            let text = args.join(' ');
            if (!text && quotedText) text = quotedText;

            if (!text) {
                await sock.sendMessage(chatId, { text: '*qr*\n\n.qr <teks/url>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let imageBuffer = null;

            // api 1: goqr
            try {
                const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                if (res.data) imageBuffer = Buffer.from(res.data);
            } catch { }

            // api 2: google charts (fallback)
            if (!imageBuffer) {
                try {
                    const url = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(text)}`;
                    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
                    if (res.data) imageBuffer = Buffer.from(res.data);
                } catch { }
            }

            await reactDone(sock, msg);

            if (imageBuffer) {
                await sock.sendMessage(chatId, { image: imageBuffer }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'gagal generate' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
