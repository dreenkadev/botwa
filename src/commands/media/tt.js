// tiktok downloader - fixed with working APIs
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'tt',
    aliases: ['tiktok', 'tta'],
    description: 'download video/audio tiktok',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];
            const isAudio = args.includes('-a') || args.includes('audio');
            const isHD = args.includes('-hd') || args.includes('hd');

            if (!url || url.startsWith('-')) {
                await sock.sendMessage(chatId, {
                    text: 'tiktok downloader\n\n.tt <url> - download video\n.tt <url> -a - download audio\n.tt <url> -hd - download hd video\n\ncontoh:\n.tt https://vm.tiktok.com/xxx'
                }, { quoted: msg });
                return;
            }

            if (!url.includes('tiktok.com') && !url.includes('vm.tiktok')) {
                await sock.sendMessage(chatId, { text: 'url tiktok tidak valid' }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            let result = null;

            // API 1: TikWM (primary)
            result = await downloadFromTikWM(url, isAudio, isHD);

            // API 2: Tiklydown (fallback)
            if (!result?.success) {
                result = await downloadFromTiklydown(url, isAudio, isHD);
            }

            // API 3: yt-dlp fallback
            if (!result?.success) {
                result = await downloadWithYtdlp(url, isAudio);
            }

            await reactDone(sock, msg);

            if (!result?.success) {
                await sock.sendMessage(chatId, { text: 'download gagal. coba lagi nanti.' }, { quoted: msg });
                return;
            }

            // Send slideshow
            if (result.type === 'slideshow' && result.images) {
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
            } else if (result.isAudio) {
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
            await sock.sendMessage(chatId, { text: 'error: ' + err.message }, { quoted: msg });
        }
    }
};

// API 1: TikWM
async function downloadFromTikWM(url, isAudio, isHD) {
    try {
        const response = await axios.get('https://www.tikwm.com/api/', {
            params: { url, hd: 1 },
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 15000
        });

        const data = response.data?.data;
        if (!data) return { success: false };

        // Slideshow
        if (data.images?.length > 0) {
            return {
                success: true,
                type: 'slideshow',
                images: data.images,
                caption: `@${data.author?.unique_id || ''}\n${(data.title || '').substring(0, 100)}`
            };
        }

        // Get media URL
        let mediaUrl;
        if (isAudio && data.music) {
            mediaUrl = data.music;
        } else if (isHD && data.hdplay) {
            mediaUrl = data.hdplay;
        } else {
            mediaUrl = data.play || data.wmplay;
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
            caption: `@${data.author?.unique_id || ''}\n${(data.title || '').substring(0, 100)}`,
            isAudio
        };
    } catch (err) {
        console.log('TikWM error:', err.message);
        return { success: false };
    }
}

// API 2: Tiklydown
async function downloadFromTiklydown(url, isAudio, isHD) {
    try {
        const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
            timeout: 15000
        });

        const data = response.data;
        if (!data?.video) return { success: false };

        let mediaUrl;
        if (isAudio && data.music?.play_url) {
            mediaUrl = data.music.play_url;
        } else if (isHD && data.video?.noWatermark) {
            mediaUrl = data.video.noWatermark;
        } else {
            mediaUrl = data.video.noWatermark || data.video.watermark;
        }

        if (!mediaUrl) return { success: false };

        const mediaRes = await axios.get(mediaUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
        });

        return {
            success: true,
            type: 'video',
            buffer: Buffer.from(mediaRes.data),
            caption: `@${data.author?.nickname || ''}\n${(data.title || '').substring(0, 100)}`,
            isAudio
        };
    } catch (err) {
        console.log('Tiklydown error:', err.message);
        return { success: false };
    }
}

// API 3: yt-dlp fallback
async function downloadWithYtdlp(url, isAudio) {
    return new Promise((resolve) => {
        const outputPath = path.join('/tmp', `tt_${Date.now()}.${isAudio ? 'mp3' : 'mp4'}`);
        const args = isAudio
            ? ['-f', 'bestaudio', '-x', '--audio-format', 'mp3', '-o', outputPath, url]
            : ['-f', 'best[ext=mp4]', '-o', outputPath, url];

        const proc = spawn('yt-dlp', args);

        let timeout = setTimeout(() => {
            proc.kill();
            resolve({ success: false });
        }, 120000);

        proc.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0 && fs.existsSync(outputPath)) {
                const buffer = fs.readFileSync(outputPath);
                try { fs.unlinkSync(outputPath); } catch { }
                resolve({
                    success: true,
                    type: 'video',
                    buffer,
                    caption: '',
                    isAudio
                });
            } else {
                resolve({ success: false });
            }
        });

        proc.on('error', () => {
            clearTimeout(timeout);
            resolve({ success: false });
        });
    });
}
