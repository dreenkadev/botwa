// ephoto - Text effect/logo generator using ephoto360
const axios = require('axios');
const cheerio = require('cheerio');
const { reactProcessing, reactDone } = require('../../utils/reaction');

// Popular effect templates
const EFFECTS = {
    'neon': 'https://en.ephoto360.com/create-colorful-neon-light-text-effect-online-711.html',
    'glitch': 'https://en.ephoto360.com/create-digital-glitch-text-effect-online-670.html',
    'thunder': 'https://en.ephoto360.com/thunder-text-effect-online-97.html',
    '3d': 'https://en.ephoto360.com/3d-text-effect-full-color-107.html',
    'gold': 'https://en.ephoto360.com/create-3d-gold-text-effect-online-free-195.html',
    'fire': 'https://en.ephoto360.com/fire-text-effects-online-195.html',
    'ice': 'https://en.ephoto360.com/frozen-ice-text-effect-212.html',
    'galaxy': 'https://en.ephoto360.com/create-galaxy-style-text-effect-online-188.html',
    'matrix': 'https://en.ephoto360.com/matrix-text-effect-94.html',
    'chrome': 'https://en.ephoto360.com/ultra-glossy-chrome-text-effect-194.html',
    'wood': 'https://en.ephoto360.com/3d-wood-text-effect-167.html',
    'blood': 'https://en.ephoto360.com/blood-text-effect-online-98.html',
    'horror': 'https://en.ephoto360.com/horror-text-effect-230.html',
    'blackpink': 'https://en.ephoto360.com/create-blackpink-logo-online-free-421.html',
    'avengers': 'https://en.ephoto360.com/create-avengers-style-text-effect-online-383.html',
    'marvel': 'https://en.ephoto360.com/create-marvel-studios-style-text-effect-online-504.html',
    'naruto': 'https://en.ephoto360.com/create-naruto-banner-text-effect-online-808.html'
};

module.exports = {
    name: 'ephoto',
    aliases: ['texteffect', 'logo', 'fx'],
    description: 'Generate text effect/logo using ephoto360',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            // Parse arguments
            const effectArg = args[0]?.toLowerCase();
            const textInput = args.slice(1).join(' ') || quotedText;

            // Show available effects if no args or invalid
            if (!effectArg || !EFFECTS[effectArg]) {
                const effectList = Object.keys(EFFECTS).map(e => `.ephoto ${e} <text>`).join('\n');
                await sock.sendMessage(chatId, {
                    text: `*🎨 EPHOTO - Text Effect Generator*\n\n*Available Effects:*\n${effectList}\n\n*Example:*\n.ephoto neon DreenkaDev\n.ephoto gold Your Name\n.ephoto blackpink LISA`
                }, { quoted: msg });
                return;
            }

            if (!textInput) {
                await sock.sendMessage(chatId, {
                    text: `*Usage:* .ephoto ${effectArg} <your text>`
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const effectUrl = EFFECTS[effectArg];
            const resultUrl = await generateEphoto(effectUrl, textInput);

            await reactDone(sock, msg);

            if (resultUrl) {
                // Download and send the image
                const imageRes = await axios.get(resultUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                await sock.sendMessage(chatId, {
                    image: Buffer.from(imageRes.data),
                    caption: `✨ *${effectArg.toUpperCase()}* effect\n📝 Text: ${textInput}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal generate effect. Coba lagi.'
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

async function generateEphoto(effectUrl, text) {
    try {
        // Step 1: Get the effect page and extract tokens
        const pageRes = await axios.get(effectUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(pageRes.data);
        const token = $('input[name=token]').val();
        const buildServer = $('input[name=build_server]').val();
        const buildServerId = $('input[name=build_server_id]').val();

        if (!token || !buildServer) {
            return null;
        }

        // Step 2: Submit the form with text
        const cookies = pageRes.headers['set-cookie']?.join('; ') || '';
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

        const formParts = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="text[]"',
            '',
            text,
            `--${boundary}`,
            'Content-Disposition: form-data; name="token"',
            '',
            token,
            `--${boundary}`,
            'Content-Disposition: form-data; name="build_server"',
            '',
            buildServer,
            `--${boundary}`,
            'Content-Disposition: form-data; name="build_server_id"',
            '',
            buildServerId || '1',
            `--${boundary}--`,
            ''
        ].join('\r\n');

        const formRes = await axios.post(effectUrl, formParts, {
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cookie': cookies
            }
        });

        // Step 3: Parse response and get image generation data
        const $2 = cheerio.load(formRes.data);
        const formValueInput = $2('input[name=form_value_input]').val();

        if (!formValueInput) {
            return null;
        }

        const jsonData = JSON.parse(formValueInput);
        jsonData['text[]'] = jsonData.text;
        delete jsonData.text;

        // Step 4: Generate the image
        const createRes = await axios.post(
            'https://en.ephoto360.com/effect/create-image',
            new URLSearchParams(jsonData).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Cookie': cookies
                }
            }
        );

        if (createRes.data?.image) {
            return buildServer + createRes.data.image;
        }

        return null;
    } catch (err) {
        console.log('Ephoto error:', err.message);
        return null;
    }
}
