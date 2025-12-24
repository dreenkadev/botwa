require('dotenv').config();

const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { handleMessage, handleGroupUpdate } = require('./src/handlers/messageHandler');
const config = require('./config');
const { initDatabase } = require('./src/utils/database');
const { getMode, setMode } = require('./src/core/state');

const logger = pino({ level: 'silent' });

let sock = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

function hasSession() {
    return fs.existsSync('./session/creds.json');
}

function clearSession() {
    try {
        fs.rmSync('./session', { recursive: true, force: true });
        console.log('[*] Session cleared');
    } catch { }
}

async function startBot() {
    const isReconnecting = hasSession();

    if (isReconnecting) {
        console.log('========================================');
        console.log('     Reconnecting to WhatsApp...');
        console.log('     Using saved session');
        console.log('========================================');
        console.log('');
    } else {
        console.log('========================================');
        console.log('     Starting DreenkaBot-WA');
        console.log('     Waiting for QR Code...');
        console.log('========================================');
        console.log('');
    }

    try {
        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`[*] Baileys v${version.join('.')} ${isLatest ? '(latest)' : ''}`);
        console.log('');

        const { state, saveCreds } = await useMultiFileAuthState('./session');

        sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            logger,
            version,
            browser: ['DreenkaBot', 'Chrome', '120.0.0'],
            connectTimeoutMs: 60000,
            qrTimeout: 40000,
            defaultQueryTimeoutMs: 60000,
            printQRInTerminal: false,
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: false,
            syncFullHistory: false
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.clear();
                console.log('========================================');
                console.log('     SCAN QR CODE WITH WHATSAPP');
                console.log('========================================');
                console.log('  1. Open WhatsApp on your phone');
                console.log('  2. Tap Menu or Settings');
                console.log('  3. Tap "Linked Devices"');
                console.log('  4. Tap "Link a Device"');
                console.log('  5. Scan this QR code');
                console.log('========================================');
                console.log('');
                qrcode.generate(qr, { small: true });
                console.log('');
                console.log('[*] Scan within 40 seconds...');
                console.log('');
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const reason = lastDisconnect?.error?.output?.payload?.error || 'Unknown';

                console.log('');
                console.log('[!] Connection closed');
                console.log(`    Status: ${statusCode}`);
                console.log(`    Reason: ${reason}`);

                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                if (statusCode === DisconnectReason.loggedOut) {
                    console.log('');
                    console.log('[!] Logged out. Clearing session...');
                    clearSession();
                    reconnectAttempts = 0;
                    setTimeout(startBot, 2000);
                    return;
                }

                if (statusCode === 405 || statusCode === 401) {
                    console.log('');
                    console.log('[!] Session issue. Clearing session...');
                    clearSession();
                    reconnectAttempts = 0;
                    setTimeout(startBot, 2000);
                    return;
                }

                if (shouldReconnect) {
                    reconnectAttempts++;
                    if (reconnectAttempts <= MAX_RECONNECT) {
                        const delay = Math.min(3000 * reconnectAttempts, 15000);
                        console.log(`[*] Reconnecting in ${delay / 1000}s... (${reconnectAttempts}/${MAX_RECONNECT})`);
                        console.log('');
                        setTimeout(startBot, delay);
                    } else {
                        console.log('');
                        console.log('[!] Max reconnect attempts. Clearing session...');
                        clearSession();
                        reconnectAttempts = 0;
                        setTimeout(startBot, 3000);
                    }
                }
            }

            if (connection === 'connecting') {
                console.log('[*] Connecting...');
            }

            if (connection === 'open') {
                reconnectAttempts = 0;

                console.clear();
                console.log('========================================');
                console.log('     CONNECTED SUCCESSFULLY!');
                console.log('========================================');
                console.log(`  Bot: ${config.botName}`);
                console.log(`  Prefix: ${config.prefix}`);
                console.log(`  Mode: ${getMode()}`);
                console.log(`  Owner: ${config.ownerName}`);
                console.log('========================================');
                console.log('  Status: Online');
                console.log('  Session: Saved');
                console.log('========================================');
                console.log('');
                console.log(`[*] ${new Date().toLocaleString()}`);
                console.log('');
                console.log('Listening for messages...');
                console.log('----------------------------------------');

                try {
                    await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, {
                        text: `*${config.botName}* is now online!\n\n${new Date().toLocaleString()}\n\n${config.signature}`
                    });
                } catch { }
            }
        });

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            for (const msg of messages) {
                handleMessage(sock, msg).catch(err => {
                    if (!err.message?.includes('rate-overlimit') && !err.message?.includes('timed out')) {
                        console.log('Msg Error:', err.message);
                    }
                });
            }
        });

        sock.ev.on('group-participants.update', (update) => {
            handleGroupUpdate(sock, update).catch(() => { });
        });

    } catch (err) {
        console.error('[!] Startup Error:', err.message);
        console.log('');
        console.log('[*] Retrying in 5 seconds...');
        setTimeout(startBot, 5000);
    }
}

process.on('SIGINT', () => {
    console.log('');
    console.log('[*] Shutting down...');
    process.exit(0);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', () => { });

module.exports = { setMode, getMode };

console.clear();
console.log('');
console.log('  =====================================');
console.log('       DreenkaBot-WA v2.0');
console.log('    WhatsApp Bot by DreenkaDev');
console.log('  =====================================');
console.log('');

initDatabase();
startBot();
