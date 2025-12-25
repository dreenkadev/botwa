// pxpic - Advanced image processing (removebg, enhance, upscale, restore, colorize)
const axios = require('axios');
const FormData = require('form-data');
const qs = require('querystring');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const TOOLS = ['removebg', 'enhance', 'upscale', 'restore', 'colorize'];

module.exports = {
    name: 'pxpic',
    aliases: ['imgtools', 'fototools'],
    description: 'Advanced image processing: removebg, enhance, upscale, restore, colorize',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.imageMessage || quotedMsg?.imageMessage;
            const tool = args[0]?.toLowerCase() || 'enhance';

            if (!imageMsg) {
                const toolList = TOOLS.map(t => `.pxpic ${t}`).join('\n');
                await sock.sendMessage(chatId, {
                    text: `*🔧 PXPIC - Image Tools*\n\nReply gambar dengan:\n${toolList}\n\n*Tools:*\n• removebg - Hapus background\n• enhance - Tingkatkan kualitas\n• upscale - Perbesar resolusi\n• restore - Perbaiki foto lama\n• colorize - Warnai foto hitam putih`
                }, { quoted: msg });
                return;
            }

            if (!TOOLS.includes(tool)) {
                await sock.sendMessage(chatId, {
                    text: `❌ Tool tidak valid. Pilih: ${TOOLS.join(', ')}`
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            // Download image
            const stream = await sock.downloadMediaMessage(
                quotedMsg ? { message: quotedMsg } : msg
            );
            const imageBuffer = Buffer.isBuffer(stream) ? stream : Buffer.from(stream);

            // Process with PxPic
            const result = await processPxPic(imageBuffer, tool);

            await reactDone(sock, msg);

            if (result) {
                // Download result
                const imgRes = await axios.get(result, {
                    responseType: 'arraybuffer',
                    timeout: 60000
                });

                await sock.sendMessage(chatId, {
                    image: Buffer.from(imgRes.data),
                    caption: `✅ *${tool.toUpperCase()}* complete!`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal memproses gambar. Coba lagi.'
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

async function processPxPic(imageBuffer, tool) {
    try {
        // Step 1: Upload image
        const fileName = Date.now() + '.jpg';
        const folder = 'uploads';

        // Get signed URL
        const signedRes = await axios.post('https://pxpic.com/getSignedUrl', {
            folder,
            fileName
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
        });

        const { presignedUrl } = signedRes.data;

        // Upload to S3
        await axios.put(presignedUrl, imageBuffer, {
            headers: { 'Content-Type': 'image/jpeg' },
            timeout: 30000
        });

        const sourceUrl = `https://files.fotoenhancer.com/uploads/${fileName}`;

        // Step 2: Process image
        const processRes = await axios.post('https://pxpic.com/callAiFunction', qs.stringify({
            imageUrl: sourceUrl,
            targetFormat: 'png',
            needCompress: 'no',
            imageQuality: '100',
            compressLevel: '6',
            fileOriginalExtension: 'jpg',
            aiFunction: tool,
            upscalingLevel: ''
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0'
            },
            timeout: 120000
        });

        // Return result URL
        if (processRes.data && typeof processRes.data === 'string') {
            return processRes.data;
        }

        if (processRes.data?.resultUrl) {
            return processRes.data.resultUrl;
        }

        return null;
    } catch (err) {
        console.log('PxPic error:', err.message);
        return null;
    }
}
