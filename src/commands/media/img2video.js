// img2video - Convert image to AI video
const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'img2video',
    aliases: ['i2v', 'animasi'],
    description: 'convert image to AI video',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.message?.imageMessage || quotedMsg?.imageMessage;
            const prompt = args.join(' ') || 'make it move naturally';

            if (!imageMsg) {
                await sock.sendMessage(chatId, {
                    text: 'img2video\n\nreply gambar + .img2video [prompt]\n\ncontoh:\n.img2video\n.img2video zoom in slowly'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'generating video... (1-2 menit)'
            }, { quoted: msg });

            const targetMsg = quotedMsg ? { message: quotedMsg } : msg;
            const imageBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            const result = await imageToVideo(imageBuffer, prompt);

            await reactDone(sock, msg);

            if (result?.url) {
                const videoRes = await axios.get(result.url, {
                    responseType: 'arraybuffer',
                    timeout: 120000
                });

                await sock.sendMessage(chatId, {
                    video: Buffer.from(videoRes.data),
                    caption: 'img2video'
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal generate video'
                }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function imageToVideo(imageBuffer, prompt) {
    try {
        // Upload image
        const form = new FormData();
        form.append('file', imageBuffer, { filename: 'image.jpg' });

        const uploadRes = await axios.post('https://api.termai.cc/upload', form, {
            headers: { ...form.getHeaders() },
            timeout: 30000
        });

        if (!uploadRes.data?.url) return null;

        // Generate video
        const genRes = await axios.post('https://api.termai.cc/api/luma/image-to-video', {
            image: uploadRes.data.url,
            prompt: prompt,
            key: 'TermAI-guest'
        }, { timeout: 30000 });

        if (!genRes.data?.id) return null;

        // Poll for result
        for (let i = 0; i < 40; i++) {
            await new Promise(r => setTimeout(r, 5000));

            const resultRes = await axios.get(`https://api.termai.cc/api/luma/status/${genRes.data.id}?key=TermAI-guest`, {
                timeout: 15000
            });

            if (resultRes.data?.video) {
                return { url: resultRes.data.video };
            }
        }

        return null;
    } catch (err) {
        console.log('Img2Video error:', err.message);
        return null;
    }
}
