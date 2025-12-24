// removebg - dengan banyak fallback api
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const FormData = require('form-data');
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'removebg',
    aliases: ['rmbg', 'nobg'],
    description: 'hapus background gambar',

    async execute(sock, msg, { chatId, mediaMessage, quotedMsg }) {
        try {
            let imageBuffer = null;

            if (mediaMessage?.type === 'image') {
                imageBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } else if (quotedMsg?.imageMessage) {
                imageBuffer = await downloadMediaMessage({ message: quotedMsg, key: msg.key }, 'buffer', {});
            }

            if (!imageBuffer) {
                await sock.sendMessage(chatId, { text: '*removebg*\n\nkirim gambar dengan caption .rmbg' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let resultBuffer = null;

            // api 1: remove.bg (butuh api key)
            const apiKey = process.env.REMOVEBG_API_KEY;
            if (apiKey) {
                try {
                    const formData = new FormData();
                    formData.append('image_file', imageBuffer, { filename: 'image.png' });
                    formData.append('size', 'auto');
                    const res = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
                        headers: { ...formData.getHeaders(), 'X-Api-Key': apiKey },
                        responseType: 'arraybuffer', timeout: 30000
                    });
                    if (res.data && res.data.length > 1000) resultBuffer = Buffer.from(res.data);
                } catch { }
            }

            // api 2: erase.bg (free)
            if (!resultBuffer) {
                try {
                    const base64 = imageBuffer.toString('base64');
                    const res = await axios.post('https://api.erase.bg/v1/remove-bg', {
                        image_base64: base64,
                        output_format: 'png'
                    }, { timeout: 30000 });
                    if (res.data?.result_b64) {
                        resultBuffer = Buffer.from(res.data.result_b64, 'base64');
                    }
                } catch { }
            }

            // api 3: clipdrop (free tier)
            if (!resultBuffer) {
                try {
                    const formData = new FormData();
                    formData.append('image_file', imageBuffer, { filename: 'image.png' });
                    const res = await axios.post('https://clipdrop-api.co/remove-background/v1', formData, {
                        headers: { ...formData.getHeaders(), 'x-api-key': 'free' },
                        responseType: 'arraybuffer', timeout: 30000
                    });
                    if (res.data && res.data.length > 1000) resultBuffer = Buffer.from(res.data);
                } catch { }
            }

            // api 4: rembg via huggingface
            if (!resultBuffer) {
                try {
                    const base64 = imageBuffer.toString('base64');
                    const res = await axios.post('https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
                        { inputs: base64 },
                        { headers: { 'Content-Type': 'application/json' }, responseType: 'arraybuffer', timeout: 60000 }
                    );
                    if (res.data && res.data.length > 1000) resultBuffer = Buffer.from(res.data);
                } catch { }
            }

            // api 5: photoroom
            if (!resultBuffer) {
                try {
                    const formData = new FormData();
                    formData.append('image_file', imageBuffer, { filename: 'image.png' });
                    const res = await axios.post('https://sdk.photoroom.com/v1/segment', formData, {
                        headers: { ...formData.getHeaders() },
                        responseType: 'arraybuffer', timeout: 30000
                    });
                    if (res.data && res.data.length > 1000) resultBuffer = Buffer.from(res.data);
                } catch { }
            }

            // api 6: lolhuman
            if (!resultBuffer) {
                try {
                    const formData = new FormData();
                    formData.append('img', imageBuffer, { filename: 'image.png' });
                    const res = await axios.post('https://api.lolhuman.xyz/api/removebg?apikey=free', formData, {
                        headers: formData.getHeaders(),
                        responseType: 'arraybuffer', timeout: 30000
                    });
                    if (res.data && res.data.length > 1000) resultBuffer = Buffer.from(res.data);
                } catch { }
            }

            await reactDone(sock, msg);

            if (resultBuffer) {
                await sock.sendMessage(chatId, { image: resultBuffer }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'semua api removebg limit/error. coba lagi nanti.' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
