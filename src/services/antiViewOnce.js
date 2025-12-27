// Anti-ViewOnce - Save viewonce media
const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const settingsPath = path.join(__dirname, '..', 'database', 'antiviewonce.json');
const savePath = path.join(__dirname, '..', '..', 'viewonce_saved');
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
 * Handle ViewOnce message
 * @returns {boolean} true if handled
 */
async function handleViewOnce(sock, msg, ownerNumber) {
    try {
        const chatId = msg.key.remoteJid;

        // Check if enabled for this chat
        if (!isEnabled(chatId)) return false;

        // Check for viewOnce message
        const viewOnce = msg.message?.viewOnceMessage ||
            msg.message?.viewOnceMessageV2 ||
            msg.message?.viewOnceMessageV2Extension;

        if (!viewOnce) return false;

        const innerMessage = viewOnce.message;
        if (!innerMessage) return false;

        // Determine media type
        let mediaType = null;
        let mediaKey = null;

        if (innerMessage.imageMessage) {
            mediaType = 'image';
            mediaKey = 'imageMessage';
        } else if (innerMessage.videoMessage) {
            mediaType = 'video';
            mediaKey = 'videoMessage';
        } else {
            return false;
        }

        // Download media
        const buffer = await downloadMediaMessage(
            { message: innerMessage, key: msg.key },
            'buffer',
            {}
        );

        if (!buffer) return false;

        // Save to folder
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath, { recursive: true });
        }

        const ext = mediaType === 'image' ? 'jpg' : 'mp4';
        const filename = `viewonce_${Date.now()}.${ext}`;
        const filePath = path.join(savePath, filename);
        fs.writeFileSync(filePath, buffer);

        // Get sender info
        const sender = msg.key.participant || msg.key.remoteJid;
        const senderNum = sender.split('@')[0];
        const isGroup = chatId.endsWith('@g.us');

        // Forward to owner
        const caption = `viewonce saved\n\nfrom: ${senderNum}\n${isGroup ? 'group: ' + chatId.split('@')[0] : 'private'}\ntime: ${new Date().toLocaleString()}`;

        if (mediaType === 'image') {
            await sock.sendMessage(ownerNumber + '@s.whatsapp.net', {
                image: buffer,
                caption
            });
        } else {
            await sock.sendMessage(ownerNumber + '@s.whatsapp.net', {
                video: buffer,
                caption
            });
        }

        console.log(`[ViewOnce] Saved from ${senderNum}`);
        return true;

    } catch (err) {
        console.log(`[ViewOnce] Error: ${err.message}`);
        return false;
    }
}

loadSettings();

module.exports = {
    handleViewOnce,
    isEnabled,
    setEnabled
};
