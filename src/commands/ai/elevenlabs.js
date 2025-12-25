// elevenlabs - Text to Speech with various voices
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const VOICES = ['adam', 'bella', 'elli', 'josh', 'rachel', 'sam', 'antoni', 'domi'];

module.exports = {
    name: 'elevenlabs',
    aliases: ['eltts', 'el', 'voice'],
    description: 'text to speech',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const voiceArg = args[0]?.toLowerCase();
            let text = args.slice(1).join(' ') || quotedText;

            // If first arg is not a voice, use default voice
            if (voiceArg && !VOICES.includes(voiceArg)) {
                text = args.join(' ') || quotedText;
            }

            if (!text) {
                await sock.sendMessage(chatId, {
                    text: `elevenlabs tts\n\n.el [voice] <text>\n.el <text> (default: bella)\n\nvoices: ${VOICES.join(', ')}\n\ncontoh:\n.el bella hello world\n.el halo semua`
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const audioBuffer = await generateTTS(text, voiceArg || 'bella');

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
    // API 1: Google Translate TTS (reliable)
    try {
        const lang = /[a-zA-Z]/.test(text) ? 'en' : 'id';
        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;

        const res = await axios.get(googleUrl, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (res.data) return Buffer.from(res.data);
    } catch { }

    // API 2: VoiceRSS (backup)
    try {
        const voiceRssUrl = `https://api.voicerss.org/?key=c4d7d17c9c7c4fc099f11a25db3c6b11&hl=en-us&src=${encodeURIComponent(text)}&f=48khz_16bit_stereo`;

        const res2 = await axios.get(voiceRssUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        if (res2.data) return Buffer.from(res2.data);
    } catch { }

    // API 3: ResponsiveVoice
    try {
        const rvUrl = `https://texttospeech.responsivevoice.org/v1/text:synthesize?text=${encodeURIComponent(text)}&lang=en&engine=g1&pitch=0.5&rate=0.5&volume=1&key=0POmS5Y2`;

        const res3 = await axios.get(rvUrl, {
            responseType: 'arraybuffer',
            timeout: 15000
        });

        if (res3.data) return Buffer.from(res3.data);
    } catch { }

    return null;
}
