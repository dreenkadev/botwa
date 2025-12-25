require('dotenv').config();

const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const http = require('http');
const { handleMessage, handleGroupUpdate } = require('./src/handlers/messageHandler');
const config = require('./config');
const { initDatabase } = require('./src/utils/database');
const { getMode, setMode } = require('./src/core/state');
const { useMongoDBAuthState, clearMongoDBSession } = require('./src/utils/mongoAuth');

const logger = pino({ level: 'silent' });

let sock = null;
let reconnectAttempts = 0;
let currentQR = null; // Store current QR for web access
let useMongoSession = false; // Track if using MongoDB
const MAX_RECONNECT = 5;

async function hasSession() {
    // Check MongoDB first if URI is set
    if (process.env.MONGODB_URI) {
        try {
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState === 1) {
                const AuthModel = mongoose.models.Auth;
                if (AuthModel) {
                    const creds = await AuthModel.findById('creds');
                    return !!creds;
                }
            }
        } catch { }
    }
    // Fallback to file check
    return fs.existsSync('./session/creds.json');
}

async function clearSession() {
    try {
        // Clear MongoDB session if using it
        if (process.env.MONGODB_URI) {
            await clearMongoDBSession();
        }
        // Also clear file session
        fs.rmSync('./session', { recursive: true, force: true });
        console.log('[*] Session cleared');
    } catch { }
}

async function startBot() {
    const isReconnecting = await hasSession();
    const usePairingCode = process.env.PHONE_NUMBER && !isReconnecting;

    if (isReconnecting) {
        console.log('========================================');
        console.log('     Reconnecting to WhatsApp...');
        console.log('     Using saved session');
        console.log('========================================');
        console.log('');
    } else if (usePairingCode) {
        console.log('========================================');
        console.log('     Starting DreenkaBot-WA');
        console.log('     Using Pairing Code (Cloud Mode)');
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

        // Try MongoDB first, fallback to file-based
        let state, saveCreds;
        if (process.env.MONGODB_URI) {
            console.log('[*] Using MongoDB for session storage');
            const mongoAuth = await useMongoDBAuthState();
            state = mongoAuth.state;
            saveCreds = mongoAuth.saveCreds;
            useMongoSession = true;
        } else {
            console.log('[*] Using file-based session storage');
            const fileAuth = await useMultiFileAuthState('./session');
            state = fileAuth.state;
            saveCreds = fileAuth.saveCreds;
        }


        sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger)
            },
            logger,
            version,
            browser: ['DreenkaBot', 'Chrome', '120.0.0'],
            connectTimeoutMs: 60000,
            qrTimeout: 60000,
            defaultQueryTimeoutMs: 60000,
            printQRInTerminal: false,
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: false,
            syncFullHistory: false
        });

        // Flag untuk track apakah sudah request pairing code
        let pairingCodeRequested = false;

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Tampilkan semua opsi login ketika dapat QR
            if (qr) {
                currentQR = qr; // Store for web access
                const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
                    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
                    : `http://localhost:${process.env.PORT || 3000}`;

                console.log('');
                console.log('╔══════════════════════════════════════╗');
                console.log('║      LOGIN OPTIONS AVAILABLE         ║');
                console.log('╠══════════════════════════════════════╣');
                console.log('║                                      ║');
                console.log('║  [1] SCAN QR CODE (Terminal)         ║');
                console.log('║  [2] OPEN QR IN BROWSER              ║');
                console.log('║  [3] USE PAIRING CODE                ║');
                console.log('║                                      ║');
                console.log('╚══════════════════════════════════════╝');
                console.log('');

                // Option 1: QR di Terminal
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('  [1] QR CODE - Scan with WhatsApp:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                qrTerminal.generate(qr, { small: true });
                console.log('');

                // Option 2: QR via Browser
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('  [2] QR IMAGE - Open in browser:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`  📎 ${baseUrl}/qr`);
                console.log('');

                // Option 3: Pairing Code
                if (process.env.PHONE_NUMBER && !pairingCodeRequested) {
                    pairingCodeRequested = true;
                    const phoneNumber = process.env.PHONE_NUMBER.replace(/[^0-9]/g, '');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('  [3] PAIRING CODE:');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    try {
                        const code = await sock.requestPairingCode(phoneNumber);
                        console.log(`  📱 Phone: ${phoneNumber}`);
                        console.log(`  🔑 Code:  ${code}`);
                        console.log('');
                        console.log('  Steps: WhatsApp > Linked Devices > Link a Device');
                        console.log('         > "Link with phone number instead"');
                        console.log(`         > Enter: ${code}`);
                    } catch (err) {
                        console.log(`  ❌ Failed: ${err.message}`);
                        console.log('  💡 Check PHONE_NUMBER format: 628xxxxxxxxxx');
                    }
                } else if (!process.env.PHONE_NUMBER) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('  [3] PAIRING CODE: (not configured)');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('  💡 Set PHONE_NUMBER env to enable');
                }

                console.log('');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('  ⏳ Waiting for authentication...');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

// HTTP Health Check Server untuk Railway + QR Image
const PORT = process.env.PORT || 3000;
const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.url === '/qr') {
        // Serve QR code as image
        if (currentQR) {
            try {
                const qrImage = await QRCode.toDataURL(currentQR, {
                    width: 512,
                    margin: 2,
                    color: { dark: '#000000', light: '#ffffff' }
                });
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>DreenkaBot - Scan QR</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                min-height: 100vh;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 20px;
                            }
                            .card {
                                background: white;
                                border-radius: 24px;
                                padding: 40px;
                                box-shadow: 0 25px 50px rgba(0,0,0,0.25);
                                text-align: center;
                                max-width: 400px;
                            }
                            h1 { color: #1a1a2e; margin-bottom: 8px; font-size: 24px; }
                            p { color: #666; margin-bottom: 24px; }
                            img { border-radius: 16px; max-width: 100%; }
                            .steps {
                                background: #f8f9fa;
                                border-radius: 12px;
                                padding: 16px;
                                margin-top: 24px;
                                text-align: left;
                                font-size: 14px;
                                color: #444;
                            }
                            .steps li { margin: 8px 0; }
                            .refresh {
                                margin-top: 16px;
                                padding: 12px 24px;
                                background: #667eea;
                                color: white;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                                font-size: 14px;
                            }
                            .refresh:hover { background: #5a67d8; }
                        </style>
                    </head>
                    <body>
                        <div class="card">
                            <h1>🤖 DreenkaBot</h1>
                            <p>Scan QR code with WhatsApp</p>
                            <img src="${qrImage}" alt="QR Code" />
                            <ol class="steps">
                                <li>Open WhatsApp on your phone</li>
                                <li>Tap <strong>Menu</strong> or <strong>Settings</strong></li>
                                <li>Tap <strong>Linked Devices</strong></li>
                                <li>Tap <strong>Link a Device</strong></li>
                                <li>Scan this QR code</li>
                            </ol>
                            <button class="refresh" onclick="location.reload()">🔄 Refresh QR</button>
                        </div>
                        <script>setTimeout(() => location.reload(), 30000);</script>
                    </body>
                    </html>
                `);
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error generating QR');
            }
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>DreenkaBot</title>
                    <meta http-equiv="refresh" content="3">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            min-height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            text-align: center;
                        }
                        .loader { font-size: 48px; animation: pulse 1s infinite; }
                        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                    </style>
                </head>
                <body>
                    <div>
                        <div class="loader">⏳</div>
                        <h2>Waiting for QR Code...</h2>
                        <p>Page will auto-refresh</p>
                    </div>
                </body>
                </html>
            `);
        }
    } else if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: currentQR ? 'waiting_auth' : 'online',
            bot: config.botName,
            uptime: process.uptime(),
            qr_available: !!currentQR,
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : `http://localhost:${PORT}`;
    console.log(`[*] Health server running on port ${PORT}`);
    console.log(`[*] QR page: ${baseUrl}/qr`);
    console.log('');
});

initDatabase();
startBot();
