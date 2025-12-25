// pxpic - Advanced image processing tools
const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const TOOLS = {
    'removebg': 'remove-background',
    'enhance': 'ai-image-enhancer',
    'upscale': 'upscale-image',
    'restore': 'ai-photo-restore',
    'colorize': 'colorize-photo'
};

module.exports = {
    name: 'pxpic',
    aliases: ['pxtools', 'imgtools'],
    description: 'image processing tools',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.message?.imageMessage || quotedMsg?.imageMessage;
            const toolArg = args[0]?.toLowerCase();

            if (!toolArg || !TOOLS[toolArg]) {
                const toolList = Object.keys(TOOLS).join(', ');
                await sock.sendMessage(chatId, {
                    text: `pxpic tools\n\nreply gambar + .pxpic <tool>\n\ntools: ${toolList}\n\ncontoh:\n.pxpic upscale\n.pxpic removebg`
                }, { quoted: msg });
                return;
            }

            if (!imageMsg) {
                await sock.sendMessage(chatId, {
                    text: 'reply gambar dengan: .pxpic ' + toolArg
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const targetMsg = quotedMsg ? { message: quotedMsg } : msg;
            const imageBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            const result = await processPxpic(imageBuffer, TOOLS[toolArg]);

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, {
                    image: result,
                    caption: `processed: ${toolArg}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal proses gambar'
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

async function processPxpic(imageBuffer, tool) {
    try {
        const form = new FormData();
        form.append('image', imageBuffer, { filename: 'image.jpg' });

        const uploadRes = await axios.post('https://pxpic.com/getImg', form, {
            headers: { ...form.getHeaders() },
            timeout: 30000
        });

        if (!uploadRes.data?.img) return null;

        const imgPath = uploadRes.data.img;

        const processRes = await axios.post(`https://pxpic.com/${tool}`, {
            img: imgPath
        }, {
            timeout: 60000
        });

        if (processRes.data?.url) {
            const resultRes = await axios.get(processRes.data.url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            return Buffer.from(resultRes.data);
        }

        return null;
    } catch (err) {
        console.log('Pxpic error:', err.message);
        return null;
    }
}
