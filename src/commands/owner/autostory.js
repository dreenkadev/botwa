// autostory - Auto post to WhatsApp Status
// Mode 1: One-time scheduled post
// Mode 2: Repeating interval post
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const config = require('../../../config');
const { reactProcessing, reactDone } = require('../../utils/reaction');

const schedulePath = path.join(__dirname, '../../..', 'database', 'autostory.json');
let scheduledStories = [];
let autoStoryInterval = null;
let botSock = null;

const DEFAULT_CAPTION = `auto post by ${config.botName || 'DreenkaBot'}`;

function loadSchedule() {
    try {
        if (fs.existsSync(schedulePath)) {
            scheduledStories = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
        }
    } catch { scheduledStories = []; }
}

function saveSchedule() {
    try {
        const dir = path.dirname(schedulePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(schedulePath, JSON.stringify(scheduledStories, null, 2));
    } catch { }
}

module.exports = {
    name: 'autostory',
    aliases: ['astory', 'sw', 'poststory', 'story'],
    description: 'auto post ke status whatsapp',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args, mediaMessage }) {
        try {
            botSock = sock;
            const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const imageMsg = mediaMessage?.message?.imageMessage || quotedMsg?.imageMessage;
            const videoMsg = mediaMessage?.message?.videoMessage || quotedMsg?.videoMessage;

            // Handle management commands first
            const action = args[0]?.toLowerCase();

            if (action === 'list') {
                loadSchedule();
                if (scheduledStories.length === 0) {
                    await sock.sendMessage(chatId, { text: 'tidak ada story terjadwal' }, { quoted: msg });
                    return;
                }

                let text = 'jadwal story:\n\n';
                scheduledStories.forEach((s, i) => {
                    const next = new Date(s.nextPost).toLocaleString('id-ID');
                    const type = s.repeat ? `repeat setiap ${s.interval}` : 'sekali';
                    text += `${i + 1}. [${type}]\n   "${s.caption}"\n   next: ${next}\n\n`;
                });
                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            if (action === 'clear' || action === 'delete') {
                loadSchedule();
                for (const s of scheduledStories) {
                    try { if (fs.existsSync(s.mediaPath)) fs.unlinkSync(s.mediaPath); } catch { }
                }
                scheduledStories = [];
                saveSchedule();
                await sock.sendMessage(chatId, { text: 'semua jadwal dihapus' }, { quoted: msg });
                return;
            }

            if (action === 'stop') {
                if (autoStoryInterval) {
                    clearInterval(autoStoryInterval);
                    autoStoryInterval = null;
                }
                await sock.sendMessage(chatId, { text: 'auto story dihentikan' }, { quoted: msg });
                return;
            }

            // If no media - show help
            if (!imageMsg && !videoMsg) {
                await sock.sendMessage(chatId, {
                    text: `autostory\n\nreply foto/video lalu:\n\nSEKALI POST:\n.story at 10:30 [caption]\n.story in 30m [caption]\n.story in 2h [caption]\n\nBERULANG:\n.story repeat 6h [caption]\n.story repeat 30m [caption]\n\nMANAGE:\n.story list\n.story clear\n.story stop\n\ncontoh:\n.story at 14:00 promo siang\n.story in 1h selamat siang\n.story repeat 6h update terbaru`
                }, { quoted: msg });
                return;
            }

            // Parse schedule type
            let scheduleType = 'now'; // default: post now
            let postTime = Date.now();
            let isRepeat = false;
            let interval = '';
            let intervalMs = 0;
            let caption = '';

            // Parse arguments
            if (action === 'at' && args[1]) {
                // .story at 10:30 caption
                scheduleType = 'at';
                const timeStr = args[1];
                const timeParts = timeStr.match(/^(\d{1,2}):(\d{2})$/);

                if (!timeParts) {
                    await sock.sendMessage(chatId, { text: 'format waktu salah. contoh: at 10:30' }, { quoted: msg });
                    return;
                }

                const hours = parseInt(timeParts[1]);
                const mins = parseInt(timeParts[2]);

                const now = new Date();
                const target = new Date();
                target.setHours(hours, mins, 0, 0);

                // If time already passed today, schedule for tomorrow
                if (target <= now) {
                    target.setDate(target.getDate() + 1);
                }

                postTime = target.getTime();
                caption = args.slice(2).join(' ');

            } else if (action === 'in' && args[1]) {
                // .story in 30m caption OR .story in 2h caption
                scheduleType = 'in';
                const delayStr = args[1];
                const delayMatch = delayStr.match(/^(\d+)(m|h)$/);

                if (!delayMatch) {
                    await sock.sendMessage(chatId, { text: 'format delay salah. contoh: in 30m atau in 2h' }, { quoted: msg });
                    return;
                }

                const num = parseInt(delayMatch[1]);
                const unit = delayMatch[2];
                const delayMs = unit === 'h' ? num * 60 * 60 * 1000 : num * 60 * 1000;

                postTime = Date.now() + delayMs;
                caption = args.slice(2).join(' ');

            } else if (action === 'repeat' && args[1]) {
                // .story repeat 6h caption
                scheduleType = 'repeat';
                isRepeat = true;
                interval = args[1];
                const intervalMatch = interval.match(/^(\d+)(m|h)$/);

                if (!intervalMatch) {
                    await sock.sendMessage(chatId, { text: 'format interval salah. contoh: repeat 6h atau repeat 30m' }, { quoted: msg });
                    return;
                }

                const num = parseInt(intervalMatch[1]);
                const unit = intervalMatch[2];
                intervalMs = unit === 'h' ? num * 60 * 60 * 1000 : num * 60 * 1000;

                postTime = Date.now(); // Post immediately first time
                caption = args.slice(2).join(' ');

            } else {
                // .story [caption] - post now
                caption = args.join(' ');
                postTime = Date.now();
            }

            // Default caption if empty
            if (!caption) caption = DEFAULT_CAPTION;

            await reactProcessing(sock, msg);

            // Download and save media
            const targetMsg = quotedMsg ? { message: quotedMsg } : msg;
            const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});
            const mediaType = imageMsg ? 'image' : 'video';
            const mediaId = Date.now().toString();
            const ext = mediaType === 'image' ? 'jpg' : 'mp4';
            const mediaDir = path.join(__dirname, '../../..', 'database');

            if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
            const mediaPath = path.join(mediaDir, `story_${mediaId}.${ext}`);

            fs.writeFileSync(mediaPath, mediaBuffer);

            loadSchedule();
            scheduledStories.push({
                id: mediaId,
                mediaPath,
                mediaType,
                caption,
                repeat: isRepeat,
                interval: interval,
                intervalMs: intervalMs,
                nextPost: postTime,
                createdAt: new Date().toISOString()
            });
            saveSchedule();

            // Start auto story checker
            startAutoStory(sock);

            await reactDone(sock, msg);

            const postTimeStr = new Date(postTime).toLocaleString('id-ID');
            let confirmText = '';

            if (scheduleType === 'now') {
                confirmText = `posting sekarang...\ncaption: ${caption}`;
            } else if (scheduleType === 'at') {
                confirmText = `dijadwalkan\nwaktu: ${postTimeStr}\ncaption: ${caption}`;
            } else if (scheduleType === 'in') {
                confirmText = `dijadwalkan\nwaktu: ${postTimeStr}\ncaption: ${caption}`;
            } else if (scheduleType === 'repeat') {
                const nextTime = new Date(Date.now() + intervalMs).toLocaleString('id-ID');
                confirmText = `posting berulang\ninterval: setiap ${interval}\npost pertama: sekarang\npost berikutnya: ${nextTime}\ncaption: ${caption}`;
            }

            await sock.sendMessage(chatId, { text: confirmText }, { quoted: msg });

        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    },

    startAutoStory,
    setBotSocket: (sock) => { botSock = sock; }
};

function startAutoStory(sock) {
    if (sock) botSock = sock;
    if (autoStoryInterval) return;

    loadSchedule();
    if (scheduledStories.length === 0) return;

    autoStoryInterval = setInterval(async () => {
        if (!botSock) return;

        loadSchedule();
        const now = Date.now();
        let changed = false;

        for (let i = scheduledStories.length - 1; i >= 0; i--) {
            const story = scheduledStories[i];

            if (story.nextPost <= now) {
                try {
                    if (fs.existsSync(story.mediaPath)) {
                        const mediaBuffer = fs.readFileSync(story.mediaPath);
                        const statusJid = 'status@broadcast';

                        const content = story.mediaType === 'image'
                            ? { image: mediaBuffer, caption: story.caption }
                            : { video: mediaBuffer, caption: story.caption };

                        await botSock.sendMessage(statusJid, content);
                        console.log(`[AutoStory] Posted: ${story.caption}`);
                    }

                    if (story.repeat) {
                        // Update next post time for repeating
                        story.nextPost = now + story.intervalMs;
                    } else {
                        // Remove one-time post and delete media
                        try { if (fs.existsSync(story.mediaPath)) fs.unlinkSync(story.mediaPath); } catch { }
                        scheduledStories.splice(i, 1);
                    }
                    changed = true;

                } catch (err) {
                    console.log('[AutoStory] Error:', err.message);
                }
            }
        }

        if (changed) saveSchedule();

        // Stop interval if no more scheduled stories
        if (scheduledStories.length === 0 && autoStoryInterval) {
            clearInterval(autoStoryInterval);
            autoStoryInterval = null;
            console.log('[AutoStory] Stopped - no more schedules');
        }
    }, 30000); // Check every 30 seconds

    console.log('[AutoStory] Started');
}
