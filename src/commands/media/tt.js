// tiktok downloader - dengan reaction dan fallback API
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getMetadataCache, setMetadataCache } = require('../../utils/cache');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'tt',
    aliases: ['tiktok', 'tta'],
    description: 'download video/audio tiktok',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];
            const isAudio = args.includes('-a') || args.includes('audio');

            if (!url || url.startsWith('-')) {
                await sock.sendMessage(chatId, { text: '*tiktok*\n\n.tt <url>\n.tt <url> -a (audio)' }, { quoted: msg });
                return;
            }

            if (!url.includes('tiktok.com') && !url.includes('vm.tiktok')) {
                await sock.sendMessage(chatId, { text: 'url tidak valid' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            // Try API fallback first (more reliable on cloud)
            let result = await downloadFromAPI(url, isAudio);

            // If API fails, try yt-dlp
            if (!result.success) {
                const info = await getMediaInfo(url);
                const mediaPath = await downloadMedia(url, isAudio ? 'audio' : 'video', 'tt');
                if (mediaPath) {
                    result = {
                        success: true,
                        buffer: fs.readFileSync(mediaPath),
                        caption: info.success ? `@${info.username}\n${(info.description || '').substring(0, 100)}` : '',
                        isAudio
                    };
                    try { fs.unlinkSync(mediaPath); } catch { }
                }
            }

            await reactDone(sock, msg);

            if (!result.success) {
                await sock.sendMessage(chatId, { text: 'download gagal' }, { quoted: msg });
                return;
            }

            if (result.isAudio || isAudio) {
                await sock.sendMessage(chatId, { audio: result.buffer, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { video: result.buffer, caption: result.caption || '', mimetype: 'video/mp4' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error: ' + err.message }, { quoted: msg });
        }
    }
};

// Fallback API - tikwm.com
async function downloadFromAPI(url, isAudio) {
    try {
        const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl, { timeout: 15000 });

        if (data.code !== 0 || !data.data) {
            return { success: false };
        }

        const mediaUrl = isAudio ? data.data.music : (data.data.hdplay || data.data.play);
        if (!mediaUrl) return { success: false };

        const response = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        return {
            success: true,
            buffer: Buffer.from(response.data),
            caption: `@${data.data.author?.unique_id || 'unknown'}\n${(data.data.title || '').substring(0, 100)}`,
            isAudio
        };
    } catch {
        return { success: false };
    }
}

function getMediaInfo(url) {
    return new Promise(resolve => {
        try {
            const cached = getMetadataCache(url);
            if (cached) { resolve(cached); return; }

            const proc = spawn('yt-dlp', ['-j', '--no-warnings', '--no-playlist', url]);
            let output = '';

            proc.stdout.on('data', d => output += d);
            proc.on('close', code => {
                if (code !== 0) { resolve({ success: false }); return; }
                try {
                    const info = JSON.parse(output);
                    const result = { success: true, username: info.uploader || 'unknown', description: info.description || '' };
                    setMetadataCache(url, result);
                    resolve(result);
                } catch { resolve({ success: false }); }
            });
            proc.on('error', () => resolve({ success: false }));
        } catch { resolve({ success: false }); }
    });
}

function downloadMedia(url, type, prefix) {
    return new Promise(resolve => {
        try {
            const filename = `${prefix}_${Date.now()}`;
            const outputPath = path.join('/tmp', `${filename}.%(ext)s`);
            const args = type === 'audio'
                ? ['-x', '--audio-format', 'mp3', '-o', outputPath, '--no-warnings', '--no-playlist', url]
                : ['-f', 'best[ext=mp4]/best', '-o', outputPath, '--no-warnings', '--no-playlist', url];

            const proc = spawn('yt-dlp', args);
            proc.on('close', code => {
                if (code !== 0) { resolve(null); return; }
                const files = fs.readdirSync('/tmp');
                const file = files.find(f => f.startsWith(filename));
                resolve(file ? path.join('/tmp', file) : null);
            });
            proc.on('error', () => resolve(null));
        } catch { resolve(null); }
    });
}

