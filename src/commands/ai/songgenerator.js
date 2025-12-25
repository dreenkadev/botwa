// songgenerator - AI Song Generator
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'songgenerator',
    aliases: ['aisong', 'songai', 'createmusic'],
    description: 'generate lagu dari text prompt',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const prompt = args.join(' ') || quotedText;

            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: 'songgenerator\n\n.songgenerator <prompt>\n\ncontoh:\n.songgenerator happy pop song\n.songgenerator sad ballad'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'generating song... (1-3 menit)'
            }, { quoted: msg });

            const result = await generateSong(prompt);

            await reactDone(sock, msg);

            if (result?.audio) {
                const audioRes = await axios.get(result.audio, {
                    responseType: 'arraybuffer',
                    timeout: 120000
                });

                await sock.sendMessage(chatId, {
                    audio: Buffer.from(audioRes.data),
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });

                await sock.sendMessage(chatId, {
                    text: `ai song\nprompt: ${prompt}`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal generate song. ' + (result?.error || 'coba lagi')
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

async function generateSong(prompt) {
    try {
        const response = await axios.post(
            'https://api.termai.cc/api/audioProcessing/song-generator',
            {},
            {
                params: { prompt: prompt, key: 'TermAI-guest' },
                timeout: 180000
            }
        );

        if (typeof response.data === 'string') {
            const matches = response.data.match(/data: (.+)/g);
            if (matches) {
                for (const match of matches) {
                    try {
                        const data = JSON.parse(match.replace('data: ', ''));
                        if (data.status === 'success' && data.result) {
                            return { audio: data.result };
                        }
                    } catch { }
                }
            }
        }

        if (response.data?.result) {
            return { audio: response.data.result };
        }
    } catch { }

    try {
        const fallbackRes = await axios.get(`https://api.siputzx.my.id/api/ai/suno?prompt=${encodeURIComponent(prompt)}`, {
            timeout: 180000
        });
        if (fallbackRes.data?.url) return { audio: fallbackRes.data.url };
    } catch { }

    return { error: 'no result' };
}
