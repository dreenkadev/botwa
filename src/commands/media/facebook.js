// facebook - dengan reaction
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'facebook',
    aliases: ['fb'],
    description: 'download dari facebook',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];

            if (!url || !url.includes('facebook.com')) {
                await sock.sendMessage(chatId, { text: '*facebook*\n\n.fb <url>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const filename = `fb_${Date.now()}`;
            const outputPath = path.join('/tmp', `${filename}.%(ext)s`);
            const proc = spawn('yt-dlp', ['-f', 'best', '-o', outputPath, '--no-warnings', url]);

            proc.on('close', async (code) => {
                const files = fs.readdirSync('/tmp');
                const file = files.find(f => f.startsWith(filename));

                await reactDone(sock, msg);

                if (code !== 0 || !file) {
                    await sock.sendMessage(chatId, { text: 'download gagal' }, { quoted: msg });
                    return;
                }

                const filePath = path.join('/tmp', file);
                await sock.sendMessage(chatId, { video: fs.readFileSync(filePath), mimetype: 'video/mp4' }, { quoted: msg });
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
