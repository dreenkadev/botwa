// imagine - dengan fallback api
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'imagine',
    aliases: ['img', 'generate'],
    description: 'generate gambar ai',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            let prompt = args.join(' ');
            if (!prompt && quotedText) prompt = quotedText;

            if (!prompt) {
                await sock.sendMessage(chatId, { text: '*imagine*\n\n.imagine <deskripsi>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let imageBuffer = null;

            // api 1: pollinations
            try {
                const res = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true`, {
                    responseType: 'arraybuffer', timeout: 60000
                });
                if (res.data) imageBuffer = Buffer.from(res.data);
            } catch { }

            // api 2: prodia (fallback)
            if (!imageBuffer) {
                try {
                    const gen = await axios.post('https://api.prodia.com/v1/sd/generate', {
                        prompt, model: 'v1-5-pruned-emaonly.safetensors', steps: 20
                    }, { headers: { 'X-Prodia-Key': 'free' }, timeout: 30000 });
                    if (gen.data?.job) {
                        await new Promise(r => setTimeout(r, 10000));
                        const result = await axios.get(`https://api.prodia.com/v1/job/${gen.data.job}`, { timeout: 30000 });
                        if (result.data?.imageUrl) {
                            const img = await axios.get(result.data.imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
                            imageBuffer = Buffer.from(img.data);
                        }
                    }
                } catch { }
            }

            await reactDone(sock, msg);

            if (imageBuffer) {
                await sock.sendMessage(chatId, { image: imageBuffer, caption: prompt }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { text: 'gagal generate' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
