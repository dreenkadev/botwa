// songgenerator - AI Song Generator
// NOTE: Free AI music generation APIs are very limited
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'songgenerator',
    aliases: ['aisong', 'songai', 'createmusic'],
    description: 'generate lagu dari prompt (experimental)',

    async execute(sock, msg, { chatId, args, quotedText }) {
        try {
            const prompt = args.join(' ') || quotedText;

            if (!prompt) {
                await sock.sendMessage(chatId, {
                    text: 'songgenerator (experimental)\n\n.songgenerator <prompt>\n\ncontoh:\n.songgenerator happy pop song\n.songgenerator sad acoustic ballad\n\nnote: fitur ini sangat terbatas karena API gratis'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'generating song... (bisa sampai 2-3 menit)\n\nnote: jika gagal, API mungkin sedang sibuk'
            }, { quoted: msg });

            const result = await generateSong(prompt);

            await reactDone(sock, msg);

            if (result?.audio) {
                try {
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
                        text: `ai song generated\nprompt: ${prompt}`
                    }, { quoted: msg });
                } catch {
                    await sock.sendMessage(chatId, {
                        text: `song generated tapi gagal download\nlink: ${result.audio}`
                    }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(chatId, {
                    text: 'gagal generate song. API gratis untuk AI music sangat terbatas dan sering down.'
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
    // API 1: Suno alternative
    try {
        const res = await axios.get(`https://api.vreden.my.id/api/suno?prompt=${encodeURIComponent(prompt)}`, {
            timeout: 180000
        });

        if (res.data?.result?.audio_url) {
            return { audio: res.data.result.audio_url };
        }
    } catch { }

    // API 2: Beat generator alternative
    try {
        const res2 = await axios.get(`https://widipe.com/suno?text=${encodeURIComponent(prompt)}`, {
            timeout: 180000
        });

        if (res2.data?.result) {
            return { audio: res2.data.result };
        }
    } catch { }

    // API 3: Mubert-like
    try {
        const res3 = await axios.get(`https://api.betabotz.eu.org/api/tools/mubert?text=${encodeURIComponent(prompt)}&apikey=free`, {
            timeout: 180000
        });

        if (res3.data?.result) {
            return { audio: res3.data.result };
        }
    } catch { }

    return null;
}
