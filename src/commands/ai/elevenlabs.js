// elevenlabs - ElevenLabs AI TTS
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const VOICES = {
    'adam': 'Adam',
    'bella': 'Bella',
    'elli': 'Elli',
    'josh': 'Josh',
    'rachel': 'Rachel',
    'sam': 'Sam',
    'antoni': 'Antoni',
    'domi': 'Domi'
};

module.exports = {
    name: 'elevenlabs',
    aliases: ['eltts', 'el'],
    description: 'text to speech with elevenlabs voices',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const voiceArg = args[0]?.toLowerCase();
            let text = args.slice(1).join(' ') || quotedText;

            if (!voiceArg || !VOICES[voiceArg]) {
                const voiceList = Object.keys(VOICES).join(', ');
                await sock.sendMessage(chatId, {
                    text: `elevenlabs tts\n\n.el <voice> <text>\n\nvoices: ${voiceList}\n\ncontoh:\n.el bella hello world`
                }, { quoted: msg });
                return;
            }

            if (!text) {
                await sock.sendMessage(chatId, {
                    text: `usage: .el ${voiceArg} <text>`
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const audioBuffer = await generateTTS(text, voiceArg);

            await reactDone(sock, msg);

            if (audioBuffer) {
                await sock.sendMessage(chatId, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal generate audio'
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

async function generateTTS(text, voice) {
    try {
        // API 1: TermAI ElevenLabs
        const res = await axios.get(`https://api.termai.cc/api/text-to-speech/elevenlabs`, {
            params: {
                text: text,
                voice: voice,
                key: 'TermAI-guest'
            },
            responseType: 'arraybuffer',
            timeout: 30000
        });

        if (res.data) {
            return Buffer.from(res.data);
        }
    } catch { }

    // Fallback: Simple TTS
    try {
        const fallbackRes = await axios.get(`https://api.siputzx.my.id/api/tools/tts?text=${encodeURIComponent(text)}`, {
            responseType: 'arraybuffer',
            timeout: 15000
        });
        return Buffer.from(fallbackRes.data);
    } catch { }

    return null;
}
