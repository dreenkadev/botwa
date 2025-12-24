// ytmp3 - dengan reaction
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'ytmp3',
    aliases: ['yta', 'ytaudio'],
    description: 'download audio youtube',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];

            if (!url) {
                await sock.sendMessage(chatId, { text: '*youtube audio*\n\n.ytmp3 <url>' }, { quoted: msg });
                return;
            }

            if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
                await sock.sendMessage(chatId, { text: 'url tidak valid' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const filename = `yta_${Date.now()}`;
            const outputPath = path.join('/tmp', `${filename}.%(ext)s`);
            const proc = spawn('yt-dlp', ['-x', '--audio-format', 'mp3', '-o', outputPath, '--no-warnings', '--no-playlist', url]);

            proc.on('close', async (code) => {
                const files = fs.readdirSync('/tmp');
                const file = files.find(f => f.startsWith(filename));

                await reactDone(sock, msg);

                if (code !== 0 || !file) {
                    await sock.sendMessage(chatId, { text: 'download gagal' }, { quoted: msg });
                    return;
                }

                const filePath = path.join('/tmp', file);
                await sock.sendMessage(chatId, { audio: fs.readFileSync(filePath), mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
                try { fs.unlinkSync(filePath); } catch { }
            });

            proc.on('error', async () => {
                await reactDone(sock, msg);
                await sock.sendMessage(chatId, { text: 'yt-dlp error' }, { quoted: msg });
            });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
