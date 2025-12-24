// twitter - dengan reaction
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'twitter',
    aliases: ['x', 'tweet'],
    description: 'download dari twitter/x',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];

            if (!url || (!url.includes('twitter.com') && !url.includes('x.com'))) {
                await sock.sendMessage(chatId, { text: '*twitter*\n\n.x <url>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const filename = `tw_${Date.now()}`;
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
                const ext = path.extname(file).toLowerCase();

                if (['.mp4', '.mov', '.webm'].includes(ext)) {
                    await sock.sendMessage(chatId, { video: fs.readFileSync(filePath), mimetype: 'video/mp4' }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { image: fs.readFileSync(filePath) }, { quoted: msg });
                }
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
