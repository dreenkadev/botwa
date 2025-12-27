// testall - Test semua commands dengan dummy data
const fs = require('fs');
const path = require('path');
const config = require('../../../config');

// Dummy data untuk testing
const DUMMY_DATA = {
    // URLs
    tiktokUrl: 'https://vm.tiktok.com/ZMY2example/',
    igUrl: 'https://www.instagram.com/p/example/',
    ytUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    spotifyUrl: 'https://open.spotify.com/track/example',
    twitterUrl: 'https://twitter.com/example/status/123',
    pinterestUrl: 'https://www.pinterest.com/pin/example/',
    mediafireUrl: 'https://www.mediafire.com/file/example',

    // Text queries
    text: 'hello world',
    prompt: 'generate a beautiful sunset',
    translate: 'hello',
    aiQuery: 'what is 2+2?',
    lyric: 'shape of you',
    weather: 'jakarta',

    // Numbers
    number: '628123456789',
    amount: '100',

    // Image path (dummy)
    imagePath: path.join(__dirname, '../../..', 'assets', 'dummy.jpg'),
};

// Commands yang bisa di-test tanpa side effects
const SAFE_TO_TEST = [
    // General (semua aman)
    'menu', 'mi', 'help', 'bot', 'ping', 'owner', 'stats', 'time',

    // Utility (read-only)
    'calc', 'qr', 'encb64', 'decb64', 'kurs', 'crypto', 'weather',

    // Fun (read-only)
    'truth', 'dare', 'bucin', 'gombal', 'fakta', 'quotes', '8ball', 'roll',
];

// Commands yang butuh grup (skip di private)
const GROUP_ONLY = [
    'groupinfo', 'linkgroup', 'listadmin', 'tagall', 'hidetag', 'kick', 'add',
    'promote', 'demote', 'mute', 'unmute', 'revoke', 'poll', 'rules', 'welcome',
    'antilink', 'antispam', 'toxicfilter', 'warn', 'unwarn', 'warnlist'
];

// Commands yang butuh media (skip tanpa simulasi)
const NEEDS_MEDIA = [
    'sticker', 'toimg', 'removebg', 'remini', 'pxpic', 'banana', 'img2video',
    'mirror', 'rotate', 'resize', 'blur', 'greyscale', 'invert', 'pixelate',
    'bass', 'slow', 'nightcore', 'mp3', 'voicecover', 'wasted', 'triggered'
];

// Commands yang butuh external API (bisa fail)
const EXTERNAL_API = [
    'tt', 'ig', 'ytmp4', 'ytmp3', 'spotify', 'twitter', 'facebook', 'pinterest',
    'mediafire', 'snackvideo', 'ttsearch', 'pinalbum', 'imagine', 'ai', 'code',
    'aivideo', 'elevenlabs', 'shion', 'songgenerator', 'translate', 'tts',
    'kbbi', 'resi', 'ongkir', 'gempa', 'sholat', 'ayat', 'doa', 'news', 'movie',
    'anime', 'lyric', 'waifu', 'neko', 'ephoto', 'brat', 'simi'
];

// Commands yang bahaya (skip)
const DANGEROUS = [
    'broadcast', 'dm', 'shutdown', 'clearcache', 'backup', 'ban', 'unban',
    'addprem', 'delprem', 'addsewa', 'autostory'
];

// Games (skip karena interaktif)
const GAMES = [
    'family100', 'tebakgambar', 'tebakbendera', 'tebakkata', 'tebakkimia',
    'susunkata', 'asahotak', 'slot', 'fishing', 'math', 'growagarden'
];

module.exports = {
    name: 'testall',
    aliases: ['test', 'healthcheck'],
    description: 'test semua commands',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args, senderId, isOwner }) {
        try {
            // Debug info
            if (args[0] === 'debug') {
                const config = require('../../../config');
                await sock.sendMessage(chatId, {
                    text: `debug info:\n\nsenderId: ${senderId}\nownerNumber: ${config.ownerNumber}\nisOwner: ${isOwner}\nmatch: ${senderId === config.ownerNumber}`
                }, { quoted: msg });
                return;
            }

            // Lazy load to avoid circular dependency
            const { getCommandsList } = require('../../handlers/commandHandler');
            const commands = getCommandsList();
            const mode = args[0]?.toLowerCase() || 'quick';

            // Quick mode: hanya cek apakah command bisa load
            if (mode === 'quick' || mode === 'q') {
                let passed = 0;
                let failed = 0;
                const errors = [];

                for (const cmd of commands) {
                    if (typeof cmd.execute === 'function') {
                        passed++;
                    } else {
                        failed++;
                        errors.push(cmd.name);
                    }
                }

                let text = `testall (quick mode)\n\n`;
                text += `total: ${commands.length}\n`;
                text += `passed: ${passed}\n`;
                text += `failed: ${failed}\n`;

                if (errors.length > 0) {
                    text += `\nerrors:\n${errors.join(', ')}`;
                }

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // Full mode: test dengan simulasi
            if (mode === 'full' || mode === 'f') {
                await sock.sendMessage(chatId, {
                    text: `testing ${commands.length} commands...\nini akan memakan waktu.`
                }, { quoted: msg });

                const results = {
                    passed: [],
                    skipped: [],
                    failed: []
                };

                for (const cmd of commands) {
                    // Skip dangerous
                    if (DANGEROUS.includes(cmd.name)) {
                        results.skipped.push(`${cmd.name} (dangerous)`);
                        continue;
                    }

                    // Skip games
                    if (GAMES.includes(cmd.name)) {
                        results.skipped.push(`${cmd.name} (interactive)`);
                        continue;
                    }

                    // Skip group only in private
                    if (GROUP_ONLY.includes(cmd.name)) {
                        results.skipped.push(`${cmd.name} (group only)`);
                        continue;
                    }

                    // Skip media commands (butuh reply)
                    if (NEEDS_MEDIA.includes(cmd.name)) {
                        results.skipped.push(`${cmd.name} (needs media)`);
                        continue;
                    }

                    // Try to execute with dummy args
                    try {
                        const dummyArgs = getDummyArgs(cmd.name);

                        // Create mock context
                        const mockContext = {
                            args: dummyArgs,
                            senderId: config.ownerNumber,
                            chatId: chatId,
                            isGroup: false,
                            isOwner: true,
                            isAdmin: true,
                            quotedMsg: null,
                            quotedText: 'test',
                            mediaMessage: null,
                            prefix: config.prefix
                        };

                        // Execute with timeout
                        const timeout = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('timeout')), 10000)
                        );

                        await Promise.race([
                            cmd.execute(sock, msg, mockContext),
                            timeout
                        ]);

                        results.passed.push(cmd.name);
                    } catch (err) {
                        if (err.message === 'timeout') {
                            results.skipped.push(`${cmd.name} (timeout)`);
                        } else {
                            results.failed.push(`${cmd.name}: ${err.message.substring(0, 30)}`);
                        }
                    }

                    // Small delay to not spam
                    await new Promise(r => setTimeout(r, 500));
                }

                // Send results
                let text = `testall results\n\n`;
                text += `passed: ${results.passed.length}\n`;
                text += `skipped: ${results.skipped.length}\n`;
                text += `failed: ${results.failed.length}\n`;

                if (results.failed.length > 0) {
                    text += `\nfailed commands:\n`;
                    results.failed.forEach(f => text += `- ${f}\n`);
                }

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // List mode: tampilkan kategori
            if (mode === 'list' || mode === 'l') {
                let text = `command categories:\n\n`;
                text += `safe to test: ${SAFE_TO_TEST.length}\n`;
                text += `external api: ${EXTERNAL_API.length}\n`;
                text += `needs media: ${NEEDS_MEDIA.length}\n`;
                text += `group only: ${GROUP_ONLY.length}\n`;
                text += `games: ${GAMES.length}\n`;
                text += `dangerous (skip): ${DANGEROUS.length}\n`;
                text += `\ntotal: ${commands.length}`;

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // Help
            await sock.sendMessage(chatId, {
                text: `testall\n\n.testall quick - cek load saja\n.testall full - test dengan simulasi\n.testall list - lihat kategori`
            }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};

// Get dummy args berdasarkan command
function getDummyArgs(cmdName) {
    const argsMap = {
        // Downloaders
        'tt': [DUMMY_DATA.tiktokUrl],
        'ig': [DUMMY_DATA.igUrl],
        'ytmp4': [DUMMY_DATA.ytUrl],
        'ytmp3': [DUMMY_DATA.ytUrl],
        'spotify': [DUMMY_DATA.spotifyUrl],
        'twitter': [DUMMY_DATA.twitterUrl],
        'pinterest': [DUMMY_DATA.pinterestUrl],
        'mediafire': [DUMMY_DATA.mediafireUrl],

        // Text queries
        'translate': [DUMMY_DATA.translate],
        'tts': [DUMMY_DATA.text],
        'ai': [DUMMY_DATA.aiQuery],
        'code': ['javascript', 'hello world'],
        'imagine': [DUMMY_DATA.prompt],
        'weather': [DUMMY_DATA.weather],
        'kbbi': ['kata'],
        'lyric': [DUMMY_DATA.lyric],
        'movie': ['avengers'],
        'anime': ['naruto'],
        'ephoto': ['1', 'test'],

        // Utility
        'calc': ['2+2'],
        'qr': ['hello'],
        'encb64': ['hello'],
        'decb64': ['aGVsbG8='],
        'kurs': ['USD'],
        'crypto': ['BTC'],

        // Fun
        'ship': ['@user1', '@user2'],
        '8ball': ['will it rain?'],

        // Info commands (no args needed)
        'mi': ['ping'],
        'help': ['ping'],
    };

    return argsMap[cmdName] || [];
}
