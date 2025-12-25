// songgenerator - AI Song Generator dari text prompt
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'songgenerator',
    aliases: ['aisong', 'songai', 'createmusic'],
    description: 'Generate lagu dari text prompt menggunakan AI',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const prompt = args.join(' ') || quotedText;
            
            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: '*🎵 AI SONG GENERATOR*\n\nUsage: .songgenerator <prompt>\n\n*Example:*\n.songgenerator happy pop song about summer\n.songgenerator sad ballad about lost love\n.songgenerator energetic EDM for workout\n\n⚠️ Proses generate bisa memakan waktu 1-3 menit.'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: '⏳ Generating song... Proses ini bisa memakan waktu 1-3 menit.'
            }, { quoted: msg });

            const result = await generateSong(prompt);

            await reactDone(sock, msg);

            if (result && result.audio) {
                // Download audio
                const audioRes = await axios.get(result.audio, {
                    responseType: 'arraybuffer',
                    timeout: 120000
                });

                const caption = `🎵 *AI Generated Song*\n\n${result.title ? `📝 Title: ${result.title}\n` : ''}📝 Prompt: ${prompt}`;

                await sock.sendMessage(chatId, {
                    audio: Buffer.from(audioRes.data),
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });

                await sock.sendMessage(chatId, {
                    text: caption
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal generate song. ' + (result?.error || 'Coba lagi nanti.')
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

async function generateSong(prompt) {
    try {
        // API 1: TermAI Song Generator
        const response = await axios.post(
            'https://api.termai.cc/api/audioProcessing/song-generator',
            {},
            {
                params: {
                    prompt: prompt,
                    key: 'TermAI-guest'
                },
                timeout: 180000 // 3 minutes
            }
        );

        // Handle SSE / streaming response
        if (typeof response.data === 'string') {
            const matches = response.data.match(/data: (.+)/g);
            if (matches) {
                for (const match of matches) {
                    try {
                        const data = JSON.parse(match.replace('data: ', ''));
                        if (data.status === 'success' && data.result) {
                            return {
                                audio: data.result,
                                title: data.title
                            };
                        }
                    } catch { }
                }
            }
        }

        if (response.data?.result) {
            return {
                audio: response.data.result,
                title: response.data.title
            };
        }

        // Fallback API
        const fallbackRes = await axios.get(`https://api.siputzx.my.id/api/ai/suno?prompt=${encodeURIComponent(prompt)}`, {
            timeout: 180000
        });

        if (fallbackRes.data?.url) {
            return { audio: fallbackRes.data.url };
        }

        return { error: 'No result from API' };
    } catch (err) {
        console.log('Song Generator error:', err.message);
        return { error: err.message };
    }
}
