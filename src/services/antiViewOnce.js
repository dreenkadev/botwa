// Anti-ViewOnce - Save viewonce media and send to owner
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const settingsPath = path.join(__dirname, '..', 'database', 'antiviewonce.json');
let settings = {};

function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch { settings = {}; }
}

function saveSettings() {
    try {
        const dir = path.dirname(settingsPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch { }
}

function isEnabled(chatId) {
    loadSettings();
    return settings[chatId]?.enabled === true;
}

function setEnabled(chatId, enabled) {
    loadSettings();
    settings[chatId] = { enabled };
    saveSettings();
}

/**
 * Handle ViewOnce message - detect, download, send to owner
 */
async function handleViewOnce(sock, msg, ownerNumber) {
    try {
        const chatId = msg.key.remoteJid;
        const m = msg.message;

        if (!m) return false;

        // Check if enabled for this chat
        if (!isEnabled(chatId)) {
            return false;
        }

        // Detect viewOnce message - check all possible formats
        let mediaType = null;
        let hasViewOnce = false;

        // Format 1: viewOnceMessage
        if (m.viewOnceMessage?.message) {
            hasViewOnce = true;
            if (m.viewOnceMessage.message.imageMessage) mediaType = 'image';
            if (m.viewOnceMessage.message.videoMessage) mediaType = 'video';
        }

        // Format 2: viewOnceMessageV2
        if (m.viewOnceMessageV2?.message) {
            hasViewOnce = true;
            if (m.viewOnceMessageV2.message.imageMessage) mediaType = 'image';
            if (m.viewOnceMessageV2.message.videoMessage) mediaType = 'video';
        }

        // Format 3: viewOnceMessageV2Extension
        if (m.viewOnceMessageV2Extension?.message) {
            hasViewOnce = true;
            if (m.viewOnceMessageV2Extension.message.imageMessage) mediaType = 'image';
            if (m.viewOnceMessageV2Extension.message.videoMessage) mediaType = 'video';
        }

        // Format 4: Check if imageMessage/videoMessage has viewOnce flag
        if (m.imageMessage?.viewOnce) {
            hasViewOnce = true;
            mediaType = 'image';
        }
        if (m.videoMessage?.viewOnce) {
            hasViewOnce = true;
            mediaType = 'video';
        }

        if (!hasViewOnce || !mediaType) {
            return false;
        }

        console.log(`[ViewOnce] DETECTED! Type: ${mediaType}, Chat: ${chatId}`);

        // Download the media
        let buffer;
        try {
            buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                {
                    reuploadRequest: sock.updateMediaMessage
                }
            );
        } catch (dlErr) {
            console.log('[ViewOnce] Download error:', dlErr.message);
            return false;
        }

        if (!buffer || buffer.length === 0) {
            console.log('[ViewOnce] Empty buffer, download failed');
            return false;
        }

        console.log(`[ViewOnce] Downloaded ${buffer.length} bytes`);

        // Get sender info
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNum = sender.split('@')[0];
        const isGroup = chatId.endsWith('@g.us');

        // Build caption
        const caption = `viewonce intercepted\n\nfrom: ${senderNum}\n${isGroup ? 'group: ' + chatId.split('@')[0] : 'private chat'}\ntime: ${new Date().toLocaleString('id-ID')}`;

        // Send to owner
        const ownerJid = ownerNumber + '@s.whatsapp.net';

        try {
            if (mediaType === 'image') {
                await sock.sendMessage(ownerJid, {
                    image: buffer,
                    caption
                });
            } else {
                await sock.sendMessage(ownerJid, {
                    video: buffer,
                    caption
                });
            }
            console.log(`[ViewOnce] Sent to owner: ${ownerNumber}`);
        } catch (sendErr) {
            console.log('[ViewOnce] Send to owner failed:', sendErr.message);
            return false;
        }

        return true;

    } catch (err) {
        console.log('[ViewOnce] Error:', err.message);
        return false;
    }
}

loadSettings();

module.exports = {
    handleViewOnce,
    isEnabled,
    setEnabled
};
