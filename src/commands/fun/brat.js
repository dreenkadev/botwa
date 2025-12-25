// brat sticker - simple text on white background
const sharp = require('sharp');

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
            // Generate simple text image using sharp with embedded font-free approach
            const stickerBuffer = await generateBratSticker(text);

            await sock.sendMessage(chatId, {
                sticker: stickerBuffer
            }, { quoted: msg });
        } catch (err) {
            console.log('Brat error:', err.message);
            await sock.sendMessage(chatId, {
                text: 'Failed to create sticker\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};

async function generateBratSticker(text) {
    const width = 512;
    const height = 512;
    const padding = 40;

    // Calculate font size based on text length
    let fontSize = Math.min(80, Math.floor(400 / Math.max(text.length / 10, 1)));
    fontSize = Math.max(fontSize, 24); // minimum font size

    // Word wrap
    const maxCharsPerLine = Math.floor((width - padding * 2) / (fontSize * 0.55));
    const lines = wrapText(text, maxCharsPerLine);

    // Adjust font size if too many lines
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    if (totalHeight > height - padding * 2) {
        fontSize = Math.floor(fontSize * ((height - padding * 2) / totalHeight));
        fontSize = Math.max(fontSize, 16);
    }

    // Create SVG with basic font stack that should work everywhere
    const yStart = (height - lines.length * lineHeight) / 2 + fontSize;

    let textElements = '';
    lines.forEach((line, i) => {
        const y = yStart + (i * lineHeight);
        // Use simple ASCII-safe rendering
        const escapedLine = escapeXml(line);
        textElements += `<text x="50%" y="${y}" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="#111" font-family="DejaVu Sans, Liberation Sans, FreeSans, sans-serif">${escapedLine}</text>`;
    });

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white"/>
    ${textElements}
</svg>`;

    return await sharp(Buffer.from(svg))
        .resize(512, 512)
        .webp({ quality: 90 })
        .toBuffer();
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

    return lines.length > 0 ? lines : [''];
}

function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
