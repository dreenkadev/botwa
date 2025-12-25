// elevenlabs - Advanced TTS dengan AI voices
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

// Available voices
const VOICES = {
    'bella': 'Bella - Female, young',
    'adam': 'Adam - Male, deep',
    'rachel': 'Rachel - Female, calm',
    'domi': 'Domi - Female, strong',
    'elli': 'Elli - Female, young',
    'josh': 'Josh - Male, young',
    'arnold': 'Arnold - Male, strong',
    'sam': 'Sam - Male, raspy'
};

module.exports = {
    name: 'elevenlabs',
    aliases: ['aitts', 'aivoice', '11labs'],
    description: 'Text to speech dengan AI ElevenLabs voices',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            // Parse voice and text
            const voice = args[0]?.toLowerCase() || 'bella';
            let text = args.slice(1).join(' ') || quotedText;

            if (!text || args.length === 0) {
                const voiceList = Object.entries(VOICES)
                    .map(([k, v]) => `• ${k}: ${v}`)
                    .join('\n');
                await sock.sendMessage(chatId, {
                    text: `*🎤 ELEVENLABS AI TTS*\n\nUsage: .elevenlabs <voice> <text>\n\n*Voices:*\n${voiceList}\n\n*Example:*\n.elevenlabs bella Hello world\n.elevenlabs adam Selamat pagi`
                }, { quoted: msg });
                return;
            }

            // If first arg is not a voice, use it as part of text
            if (!VOICES[voice]) {
                text = args.join(' ');
            }

            await reactProcessing(sock, msg);

            const audioBuffer = await generateElevenLabsTTS(text, voice);

            await reactDone(sock, msg);

            if (audioBuffer) {
                await sock.sendMessage(chatId, {
                    audio: audioBuffer,
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal generate audio. Coba lagi.'
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

async function generateElevenLabsTTS(text, voice) {
    try {
        // API 1: TermAI ElevenLabs
        const response = await axios.get('https://api.termai.cc/api/text2speech/elevenlabs', {
            params: {
                text: text,
                voice: voice,
                pitch: 0,
                speed: 1,
                key: 'TermAI-guest'
            },
            responseType: 'arraybuffer',
            timeout: 60000
        });

        if (response.data && response.data.byteLength > 1000) {
            return Buffer.from(response.data);
        }

        // Fallback to simpler TTS
        const fallback = await axios.get(
            `https://api.siputzx.my.id/api/tools/tts?text=${encodeURIComponent(text)}&lang=id`,
            { responseType: 'arraybuffer', timeout: 30000 }
        );

        if (fallback.data) {
            return Buffer.from(fallback.data);
        }

        return null;
    } catch (err) {
        console.log('ElevenLabs error:', err.message);
        return null;
    }
}
