// instagram downloader - dengan reaction dan fallback API
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getMetadataCache, setMetadataCache } = require('../../utils/cache');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'ig',
    aliases: ['instagram', 'iga'],
    description: 'download instagram post/reels',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];
            const isAudio = args.includes('-a');

            if (!url || url.startsWith('-')) {
                await sock.sendMessage(chatId, { text: '*instagram*\n\n.ig <url>\n.ig <url> -a (audio)' }, { quoted: msg });
                return;
            }

            if (!url.includes('instagram.com')) {
                await sock.sendMessage(chatId, { text: 'url tidak valid' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            // Try API fallback first (more reliable on cloud)
            let result = await downloadFromAPI(url, isAudio);

            // If API fails, try yt-dlp
            if (!result.success) {
                const info = await getMediaInfo(url);
                const mediaPath = await downloadMedia(url, isAudio ? 'audio' : 'video', 'ig');
                if (mediaPath) {
                    const ext = path.extname(mediaPath).toLowerCase();
                    const isVideo = ['.mp4', '.mov', '.webm'].includes(ext);
                    result = {
                        success: true,
                        buffer: fs.readFileSync(mediaPath),
                        caption: info.success ? `@${info.username}` : '',
                        isVideo,
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
            } else if (result.isVideo !== false) {
                await sock.sendMessage(chatId, { video: result.buffer, caption: result.caption || '', mimetype: 'video/mp4' }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, { image: result.buffer, caption: result.caption || '' }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: 'error: ' + err.message }, { quoted: msg });
        }
    }
};

// Fallback API - igdownloader
async function downloadFromAPI(url, isAudio) {
    try {
        // Try multiple APIs
        const apis = [
            `https://api.tiklydown.eu.org/api/download/instagram?url=${encodeURIComponent(url)}`,
            `https://igram.world/api/convert?url=${encodeURIComponent(url)}`
        ];

        for (const apiUrl of apis) {
            try {
                const { data } = await axios.get(apiUrl, {
                    timeout: 15000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                let mediaUrl = null;
                let username = 'unknown';
                let isVideo = true;

                // Parse different API responses
                if (data.result?.video || data.result?.image) {
                    mediaUrl = data.result.video || data.result.image;
                    username = data.result.author || 'unknown';
                    isVideo = !!data.result.video;
                } else if (data.url) {
                    mediaUrl = data.url;
                } else if (Array.isArray(data) && data[0]?.url) {
                    mediaUrl = data[0].url;
                }

                if (!mediaUrl) continue;

                const response = await axios.get(mediaUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                return {
                    success: true,
                    buffer: Buffer.from(response.data),
                    caption: `@${username}`,
                    isVideo,
                    isAudio
                };
            } catch { continue; }
        }
        return { success: false };
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
                    const result = { success: true, username: info.uploader || 'unknown' };
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
                : ['-f', 'best', '-o', outputPath, '--no-warnings', '--no-playlist', url];

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

