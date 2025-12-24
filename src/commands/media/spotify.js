// spotify - dengan reaction
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'spotify',
    aliases: ['sp'],
    description: 'download dari spotify',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];

            if (!url || !url.includes('spotify.com')) {
                await sock.sendMessage(chatId, { text: '*spotify*\n\n.sp <url>' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const filename = `sp_${Date.now()}`;
            const outputPath = path.join('/tmp', `${filename}.%(ext)s`);
            const proc = spawn('yt-dlp', ['-x', '--audio-format', 'mp3', '-o', outputPath, '--no-warnings', url]);

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
