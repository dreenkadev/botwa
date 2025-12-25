// img2video - Convert image to AI-generated video (Luma AI style)
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'img2video',
    aliases: ['i2v', 'imgvideo', 'animate'],
    description: 'Convert image to animated video using AI',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            // Check for quoted image
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.imageMessage || quotedMsg?.imageMessage;

            if (!imageMsg) {
                await sock.sendMessage(chatId, {
                    text: `*🎬 IMAGE TO VIDEO*\n\nReply gambar dengan:\n.img2video [prompt]\n\n*Examples:*\nReply gambar + .img2video\nReply gambar + .img2video zoom in slowly\nReply gambar + .img2video camera pan right`
                }, { quoted: msg });
                return;
            }

            const prompt = args.join(' ') || 'smooth animation';

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: '⏳ Generating video... Ini mungkin memakan waktu 30-60 detik.'
            }, { quoted: msg });

            // Download image from message
            const stream = await sock.downloadMediaMessage(
                quotedMsg ? { message: quotedMsg } : msg
            );
            const imageBuffer = Buffer.isBuffer(stream) ? stream : Buffer.from(stream);

            // Generate video
            const videoUrl = await generateVideo(imageBuffer, prompt);

            await reactDone(sock, msg);

            if (videoUrl) {
                // Download video
                const videoRes = await axios.get(videoUrl, {
                    responseType: 'arraybuffer',
                    timeout: 120000
                });

                await sock.sendMessage(chatId, {
                    video: Buffer.from(videoRes.data),
                    caption: `✨ *Image to Video*\n📝 Prompt: ${prompt}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal generate video. Coba lagi nanti.'
                }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: '❌ Error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function generateVideo(imageBuffer, prompt) {
    try {
        // API 1: Try TermAI Luma
        const response = await axios.post(
            'https://api.termai.cc/api/img2video/luma',
            imageBuffer,
            {
                params: { key: 'TermAI-guest' },
                headers: { 'Content-Type': 'application/octet-stream' },
                timeout: 120000
            }
        );

        // Parse SSE response
        if (typeof response.data === 'string') {
            const lines = response.data.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        if (data.status === 'completed' && data.video?.url) {
                            return data.video.url;
                        }
                    } catch { }
                }
            }
        }

        if (response.data?.video?.url) {
            return response.data.video.url;
        }

        // API 2: Alternative img2video
        const form = new (require('form-data'))();
        form.append('image', imageBuffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });
        form.append('prompt', prompt);

        const altRes = await axios.post(
            'https://api.siputzx.my.id/api/ai/img2video',
            form,
            {
                headers: form.getHeaders(),
                timeout: 120000
            }
        );

        if (altRes.data?.url) {
            return altRes.data.url;
        }

        return null;
    } catch (err) {
        console.log('Img2Video error:', err.message);
        return null;
    }
}
