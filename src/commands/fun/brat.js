const sharp = require('sharp');
const axios = require('axios');

module.exports = {
    name: 'brat',
    aliases: ['brattext'],
    description: 'Create brat sticker with custom text',
    noSignature: true,

    async execute(sock, msg, { chatId, args, quotedText }) {
        let text = args.join(' ');

        if (!text && quotedText) {
            text = quotedText;
        }

        if (!text) {
            await sock.sendMessage(chatId, {
                text: '.brat <text> or reply to a message with .brat\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            // Try API first (more reliable on cloud without fonts)
            let stickerBuffer = await generateFromAPI(text);

            // Fallback to local SVG if API fails
            if (!stickerBuffer) {
                stickerBuffer = await generateLocal(text);
            }

            if (!stickerBuffer) {
                throw new Error('Failed to generate');
            }

            await sock.sendMessage(chatId, {
                sticker: stickerBuffer
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'Failed to create sticker\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};

// Generate using external API
async function generateFromAPI(text) {
    try {
        // Brat-style generator API
        const apiUrl = `https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });

        return await sharp(Buffer.from(response.data))
            .resize(512, 512)
            .webp({ quality: 90 })
            .toBuffer();
    } catch {
        // Try alternative API
        try {
            const altUrl = `https://api.lolhuman.xyz/api/brat?apikey=GatauDeh&text=${encodeURIComponent(text)}`;
            const response = await axios.get(altUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
            });

            return await sharp(Buffer.from(response.data))
                .resize(512, 512)
                .webp({ quality: 90 })
                .toBuffer();
        } catch {
            return null;
        }
    }
}

// Local SVG generation (fallback)
async function generateLocal(text) {
    try {
        const width = 512;
        const height = 512;
        const padding = 30;
        const availableWidth = width - (padding * 2);
        const availableHeight = height - (padding * 2);

        let fontSize = 100;
        let lines = [];
        let fits = false;

        while (fontSize > 16 && !fits) {
            const charsPerLine = Math.floor(availableWidth / (fontSize * 0.52));
            lines = wrapText(text, charsPerLine);
            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;

            if (totalHeight <= availableHeight) {
                fits = true;
            } else {
                fontSize -= 4;
            }
        }

        const lineHeight = fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;
        const startY = padding + (availableHeight - totalTextHeight) / 2 + fontSize * 0.85;

        let textElements = '';
        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            const x = width / 2;
            textElements += `<text x="${x}" y="${y}" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="black">${escapeXml(line)}</text>`;
        });

        const svgImage = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="white"/>
            ${textElements}
        </svg>`;

        return await sharp(Buffer.from(svgImage))
            .resize(512, 512)
            .webp({ quality: 90 })
            .toBuffer();
    } catch {
        return null;
    }
}

function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= maxChars) {
            currentLine = (currentLine + ' ' + word).trim();
        } else {
            if (currentLine) lines.push(currentLine);
            if (word.length > maxChars) {
                // Split long words
                let remaining = word;
                while (remaining.length > maxChars) {
                    lines.push(remaining.substring(0, maxChars));
                    remaining = remaining.substring(maxChars);
                }
                currentLine = remaining;
            } else {
                currentLine = word;
            }
        }
    }
    if (currentLine) lines.push(currentLine);

    return lines;
}

function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
