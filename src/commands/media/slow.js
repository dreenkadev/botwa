// slow - dengan reaction
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'slow',
    aliases: ['slowed'],
    description: 'slowed audio',

    async execute(sock, msg, { chatId, args, mediaMessage, quotedMsg }) {
        try {
            let audioBuffer = null;

            if (mediaMessage?.type === 'audio') {
                audioBuffer = await downloadMediaMessage(msg, 'buffer', {});
            } else if (quotedMsg?.audioMessage) {
                audioBuffer = await downloadMediaMessage({ message: quotedMsg, key: msg.key }, 'buffer', {});
            }

            if (!audioBuffer) {
                await sock.sendMessage(chatId, { text: '*slow*\n\n.slow [speed]' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const speed = Math.min(Math.max(parseFloat(args[0]) || 0.8, 0.5), 1.0);
            const inputPath = path.join('/tmp', `slow_in_${Date.now()}.mp3`);
            const outputPath = path.join('/tmp', `slow_out_${Date.now()}.mp3`);

            fs.writeFileSync(inputPath, audioBuffer);
            const proc = spawn('ffmpeg', ['-i', inputPath, '-af', `atempo=${speed}`, '-y', outputPath]);

            proc.on('close', async (code) => {
                await reactDone(sock, msg);
                if (code === 0 && fs.existsSync(outputPath)) {
                    await sock.sendMessage(chatId, { audio: fs.readFileSync(outputPath), mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: 'gagal' }, { quoted: msg });
                }
                try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch { }
            });

            proc.on('error', async () => {
                await reactDone(sock, msg);
                await sock.sendMessage(chatId, { text: 'ffmpeg error' }, { quoted: msg });
            });
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
