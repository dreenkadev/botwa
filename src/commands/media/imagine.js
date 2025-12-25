// imagine - text to image AI dengan multiple API, style & size options
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const STYLES = {
    default: '',
    anime: 'anime style, high quality anime art',
    realistic: 'photorealistic, ultra detailed, 8k',
    '3d': '3d render, octane render, unreal engine',
    pixel: 'pixel art, 8-bit style',
    watercolor: 'watercolor painting style',
    oil: 'oil painting, classical art style',
    sketch: 'pencil sketch, hand drawn',
    cyberpunk: 'cyberpunk style, neon lights, futuristic',
    fantasy: 'fantasy art, magical, ethereal',
    minimalist: 'minimalist, simple, clean design',
    cartoon: 'cartoon style, vibrant colors'
};

const SIZES = {
    square: { width: 512, height: 512 },
    portrait: { width: 512, height: 768 },
    landscape: { width: 768, height: 512 },
    wide: { width: 896, height: 512 },
    tall: { width: 512, height: 896 }
};

module.exports = {
    name: 'imagine',
    aliases: ['img', 'generate', 'txt2img'],
    description: 'generate gambar AI dengan style & size options',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            // Parse arguments
            let prompt = '';
            let style = 'default';
            let size = 'square';

            // Check for flags
            const flagArgs = [];
            const promptArgs = [];

            for (const arg of args) {
                if (arg.startsWith('-s:') || arg.startsWith('--style:')) {
                    style = arg.split(':')[1]?.toLowerCase() || 'default';
                } else if (arg.startsWith('-z:') || arg.startsWith('--size:')) {
                    size = arg.split(':')[1]?.toLowerCase() || 'square';
                } else if (arg === '--anime') {
                    style = 'anime';
                } else if (arg === '--realistic') {
                    style = 'realistic';
                } else if (arg === '--3d') {
                    style = '3d';
                } else if (arg === '--portrait') {
                    size = 'portrait';
                } else if (arg === '--landscape') {
                    size = 'landscape';
                } else {
                    promptArgs.push(arg);
                }
            }

            prompt = promptArgs.join(' ') || quotedText || '';

            // Show help if no prompt
            if (!prompt) {
                const styleList = Object.keys(STYLES).join(', ');
                const sizeList = Object.keys(SIZES).join(', ');
                await sock.sendMessage(chatId, {
                    text: `*🎨 IMAGINE - AI Image Generator*

*Usage:*
.imagine <deskripsi>
.imagine <deskripsi> --anime
.imagine <deskripsi> -s:realistic -z:landscape

*Styles:* ${styleList}

*Sizes:* ${sizeList}

*Examples:*
.imagine cute cat playing piano
.imagine beautiful sunset --anime
.imagine city at night -s:cyberpunk -z:wide
.imagine portrait of a woman --realistic --portrait`
                }, { quoted: msg });
                return;
            }

            // Validate style and size
            if (!STYLES[style]) style = 'default';
            if (!SIZES[size]) size = 'square';

            const { width, height } = SIZES[size];
            const stylePrompt = STYLES[style];
            const fullPrompt = stylePrompt ? `${prompt}, ${stylePrompt}` : prompt;

            await reactProcessing(sock, msg);

            let imageBuffer = null;
            let usedApi = '';

            // API 1: Pollinations (Fast, Free)
            if (!imageBuffer) {
                try {
                    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&nologo=true`;
                    const res = await axios.get(url, {
                        responseType: 'arraybuffer',
                        timeout: 60000
                    });
                    if (res.data && res.data.byteLength > 1000) {
                        imageBuffer = Buffer.from(res.data);
                        usedApi = 'Pollinations';
                    }
                } catch { }
            }

            // API 2: Craiyon / DALL-E Mini clone
            if (!imageBuffer) {
                try {
                    const res = await axios.post('https://api.craiyon.com/v3', {
                        prompt: fullPrompt,
                        version: 'c4ue22fb7kb',
                        token: null
                    }, { timeout: 90000 });

                    if (res.data?.images?.[0]) {
                        const imgData = res.data.images[0];
                        imageBuffer = Buffer.from(imgData, 'base64');
                        usedApi = 'Craiyon';
                    }
                } catch { }
            }

            // API 3: Lexica Art Search (alternative - finds similar)
            if (!imageBuffer) {
                try {
                    const search = await axios.get(`https://lexica.art/api/v1/search?q=${encodeURIComponent(fullPrompt)}`, {
                        timeout: 15000
                    });
                    if (search.data?.images?.[0]?.src) {
                        const imgRes = await axios.get(search.data.images[0].src, {
                            responseType: 'arraybuffer',
                            timeout: 15000
                        });
                        imageBuffer = Buffer.from(imgRes.data);
                        usedApi = 'Lexica';
                    }
                } catch { }
            }

            // API 4: Picsum (Ultimate fallback - random image)
            if (!imageBuffer) {
                try {
                    const res = await axios.get(`https://picsum.photos/${width}/${height}`, {
                        responseType: 'arraybuffer',
                        timeout: 10000
                    });
                    imageBuffer = Buffer.from(res.data);
                    usedApi = 'Random';
                } catch { }
            }

            await reactDone(sock, msg);

            if (imageBuffer) {
                const caption = `🎨 *${prompt}*\n\n` +
                    `📐 Size: ${size} (${width}x${height})\n` +
                    `🎭 Style: ${style}\n` +
                    `🔧 API: ${usedApi}`;

                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal generate gambar. Coba lagi nanti.'
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
