// tiktok downloader - enhanced dengan HD, slideshow support, dan rich metadata
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getMetadataCache, setMetadataCache } = require('../../utils/cache');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'tt',
    aliases: ['tiktok', 'tta'],
    description: 'download video/audio TikTok dengan HD & rich metadata',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];
            const isAudio = args.includes('-a') || args.includes('audio');
            const isHD = args.includes('-hd') || args.includes('hd');

            if (!url || url.startsWith('-')) {
                await sock.sendMessage(chatId, {
                    text: '*📹 TIKTOK DOWNLOADER*\n\n' +
                        '.tt <url> - Download video\n' +
                        '.tt <url> -a - Download audio\n' +
                        '.tt <url> -hd - Download HD video\n\n' +
                        '*Example:*\n.tt https://vm.tiktok.com/xxx'
                }, { quoted: msg });
                return;
            }

            if (!url.includes('tiktok.com') && !url.includes('vm.tiktok')) {
                await sock.sendMessage(chatId, { text: '❌ URL TikTok tidak valid' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            // Try enhanced API first (more reliable & rich metadata)
            let result = await downloadTikTokEnhanced(url, isAudio, isHD);

            // If API fails, try yt-dlp fallback
            if (!result.success) {
                const info = await getMediaInfo(url);
                const mediaPath = await downloadMedia(url, isAudio ? 'audio' : 'video', 'tt');
                if (mediaPath) {
                    result = {
                        success: true,
                        type: 'video',
                        buffer: fs.readFileSync(mediaPath),
                        caption: info.success ? `@${info.username}\n${(info.description || '').substring(0, 100)}` : '',
                        isAudio
                    };
                    try { fs.unlinkSync(mediaPath); } catch { }
                }
            }

            await reactDone(sock, msg);

            if (!result.success) {
                await sock.sendMessage(chatId, { text: '❌ Download gagal. Coba lagi.' }, { quoted: msg });
                return;
            }

            // Handle slideshow (multiple images)
            if (result.type === 'slideshow' && result.images) {
                // Send first few images
                for (let i = 0; i < Math.min(result.images.length, 5); i++) {
                    try {
                        const imgRes = await axios.get(result.images[i], {
                            responseType: 'arraybuffer',
                            timeout: 15000
                        });
                        await sock.sendMessage(chatId, {
                            image: Buffer.from(imgRes.data),
                            caption: i === 0 ? result.caption : ''
                        }, { quoted: msg });
                    } catch { }
                }

                // Also send audio if available
                if (result.musicUrl) {
                    try {
                        const audioRes = await axios.get(result.musicUrl, {
                            responseType: 'arraybuffer',
                            timeout: 15000
                        });
                        await sock.sendMessage(chatId, {
                            audio: Buffer.from(audioRes.data),
                            mimetype: 'audio/mpeg',
                            ptt: false
                        }, { quoted: msg });
                    } catch { }
                }
            } else if (result.isAudio || isAudio) {
                await sock.sendMessage(chatId, {
                    audio: result.buffer,
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    video: result.buffer,
                    caption: result.caption || '',
                    mimetype: 'video/mp4'
                }, { quoted: msg });
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, { text: '❌ Error: ' + err.message }, { quoted: msg });
        }
    }
};

// Enhanced TikWM API with rich metadata
async function downloadTikTokEnhanced(url, isAudio, isHD) {
    try {
        const response = await axios.post('https://www.tikwm.com/api/', {}, {
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Origin': 'https://www.tikwm.com',
                'Referer': 'https://www.tikwm.com/',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/116.0.0.0 Mobile Safari/537.36'
            },
            params: {
                url: url,
                count: 12,
                cursor: 0,
                web: 1,
                hd: 1
            },
            timeout: 20000
        });

        const res = response.data?.data;
        if (!res) return { success: false };

        // Check if it's a slideshow (images)
        if (res.duration === 0 && res.images?.length > 0) {
            return {
                success: true,
                type: 'slideshow',
                images: res.images,
                musicUrl: res.music ? 'https://www.tikwm.com' + res.music : null,
                caption: formatCaption(res)
            };
        }

        // Video download
        let mediaUrl;
        if (isAudio) {
            mediaUrl = res.music ? 'https://www.tikwm.com' + res.music : res.music_info?.play;
        } else if (isHD && res.hdplay) {
            mediaUrl = 'https://www.tikwm.com' + res.hdplay;
        } else {
            mediaUrl = res.play ? 'https://www.tikwm.com' + res.play : res.wmplay;
        }

        if (!mediaUrl) return { success: false };

        const mediaRes = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        return {
            success: true,
            type: 'video',
            buffer: Buffer.from(mediaRes.data),
            caption: formatCaption(res),
            isAudio
        };
    } catch (err) {
        console.log('TikTok API error:', err.message);
        return { success: false };
    }
}

function formatCaption(res) {
    const formatNum = (n) => {
        if (!n) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    };

    let caption = `*📹 TikTok*\n\n`;
    caption += `👤 @${res.author?.unique_id || 'unknown'}\n`;
    caption += `📝 ${(res.title || 'No caption').substring(0, 150)}\n\n`;
    caption += `❤️ ${formatNum(res.digg_count)} | `;
    caption += `💬 ${formatNum(res.comment_count)} | `;
    caption += `👁️ ${formatNum(res.play_count)}\n`;

    if (res.music_info?.title) {
        caption += `🎵 ${res.music_info.title}`;
    }

    return caption;
}

// yt-dlp fallback
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
