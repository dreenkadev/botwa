// voicecover - AI voice cover
const axios = require('axios');
const FormData = require('form-data');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const MODELS = {
    'miku': 'Hatsune Miku',
    'ariana': 'Ariana Grande',
    'taylor': 'Taylor Swift',
    'billie': 'Billie Eilish',
    'drake': 'Drake',
    'weeknd': 'The Weeknd',
    'ed': 'Ed Sheeran',
    'bruno': 'Bruno Mars'
};

module.exports = {
    name: 'voicecover',
    aliases: ['vc', 'cover', 'voiceai'],
    description: 'ai voice cover',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const audioMsg = mediaMessage?.message?.audioMessage || quotedMsg?.audioMessage;
            const modelArg = args[0]?.toLowerCase();

            if (!modelArg || !MODELS[modelArg]) {
                const modelList = Object.entries(MODELS).map(([k, v]) => `${k} (${v})`).join('\n');
                await sock.sendMessage(chatId, {
                    text: `voicecover\n\nreply audio + .voicecover <model>\n\nmodels:\n${modelList}\n\ncontoh:\n.voicecover miku`
                }, { quoted: msg });
                return;
            }

            if (!audioMsg) {
                await sock.sendMessage(chatId, {
                    text: 'reply audio dengan: .voicecover ' + modelArg
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'processing voice cover... (30-60 detik)'
            }, { quoted: msg });

            const targetMsg = quotedMsg ? { message: quotedMsg } : msg;
            const audioBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            const result = await generateVoiceCover(audioBuffer, MODELS[modelArg]);

            await reactDone(sock, msg);

            if (result) {
                await sock.sendMessage(chatId, {
                    audio: result,
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal generate voice cover'
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

async function generateVoiceCover(audioBuffer, model) {
    try {
        const form = new FormData();
        form.append('file', audioBuffer, { filename: 'audio.mp3' });

        const uploadRes = await axios.post('https://api.termai.cc/upload', form, {
            headers: { ...form.getHeaders() },
            timeout: 30000
        });

        if (!uploadRes.data?.url) return null;

        const coverRes = await axios.post('https://api.termai.cc/api/audioProcessing/voice-cover', {
            audioPath: uploadRes.data.url,
            singer: model,
            key: 'TermAI-guest'
        }, { timeout: 120000, responseType: 'arraybuffer' });

        if (coverRes.data) {
            return Buffer.from(coverRes.data);
        }

        return null;
    } catch (err) {
        console.log('VoiceCover error:', err.message);
        return null;
    }
}
