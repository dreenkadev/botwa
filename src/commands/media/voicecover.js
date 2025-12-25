// voicecover - AI voice cover untuk lagu
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { reactProcessing, reactDone } = require('../../utils/reaction');

// AI Voice models yang tersedia
const VOICE_MODELS = [
    'Miku', 'Ariana Grande', 'Taylor Swift', 'Bruno Mars', 'Ed Sheeran',
    'Billie Eilish', 'The Weeknd', 'Dua Lipa', 'Justin Bieber', 'Drake',
    'Kanye West', 'Rihanna', 'Adele', 'Lady Gaga', 'Selena Gomez'
];

module.exports = {
    name: 'voicecover',
    aliases: ['aicover', 'vc', 'voiceai'],
    description: 'Convert audio to AI voice cover',

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            // Check for quoted audio
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const audioMsg = mediaMessage?.audioMessage || quotedMsg?.audioMessage ||
                quotedMsg?.documentMessage;

            // Show help if no audio
            if (!audioMsg) {
                const modelList = VOICE_MODELS.slice(0, 10).join(', ');
                await sock.sendMessage(chatId, {
                    text: `*🎤 AI VOICE COVER*\n\nReply audio/voice note dengan:\n.voicecover <model>\n\n*Available Models:*\n${modelList}, dll.\n\n*Example:*\nReply audio + .voicecover Miku\nReply audio + .voicecover Taylor Swift`
                }, { quoted: msg });
                return;
            }

            // Get model name
            const model = args.join(' ') || 'Miku';

            await reactProcessing(sock, msg);

            // Download audio from message
            const stream = await sock.downloadMediaMessage(
                quotedMsg ? { message: quotedMsg } : msg
            );
            const audioBuffer = Buffer.isBuffer(stream) ? stream : Buffer.from(stream);

            // Try AI Voice Cover API
            const result = await generateVoiceCover(audioBuffer, model);

            await reactDone(sock, msg);

            if (result) {
                // Download result audio
                const audioRes = await axios.get(result, {
                    responseType: 'arraybuffer',
                    timeout: 60000
                });

                await sock.sendMessage(chatId, {
                    audio: Buffer.from(audioRes.data),
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });

                await sock.sendMessage(chatId, {
                    text: `✅ *Voice Cover Complete!*\n🎤 Model: ${model}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal generate voice cover. Coba voice model lain atau audio yang berbeda.'
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

async function generateVoiceCover(audioBuffer, model) {
    try {
        // API 1: TermAI (if available)
        const response = await axios.post(
            'https://api.termai.cc/api/audioProcessing/voice-covers',
            audioBuffer,
            {
                params: {
                    model: model,
                    key: 'TermAI-guest'
                },
                headers: {
                    'Content-Type': 'audio/mpeg'
                },
                timeout: 120000
            }
        );

        if (response.data?.result) {
            return response.data.result;
        }

        // Parse SSE response if streaming
        if (typeof response.data === 'string') {
            const matches = response.data.match(/data: (.+)/g);
            if (matches) {
                for (const match of matches) {
                    try {
                        const data = JSON.parse(match.replace('data: ', ''));
                        if (data.status === 'success' && data.result) {
                            return data.result;
                        }
                    } catch { }
                }
            }
        }

        return null;
    } catch (err) {
        console.log('Voice Cover API error:', err.message);

        // Try alternative API
        try {
            const form = new (require('form-data'))();
            form.append('audio', audioBuffer, {
                filename: 'audio.mp3',
                contentType: 'audio/mpeg'
            });
            form.append('model', model);

            const altRes = await axios.post(
                'https://api.siputzx.my.id/api/ai/voice-cover',
                form,
                {
                    headers: form.getHeaders(),
                    timeout: 120000
                }
            );

            if (altRes.data?.url) {
                return altRes.data.url;
            }
        } catch { }

        return null;
    }
}
