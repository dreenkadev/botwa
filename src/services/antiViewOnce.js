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

        // Check for viewOnce message types
        const m = msg.message;
        if (!m) return false;

        let viewOnceContent = null;
        let mediaType = null;

        // Check different viewOnce formats
        if (m.viewOnceMessage?.message?.imageMessage) {
            viewOnceContent = m.viewOnceMessage.message.imageMessage;
            mediaType = 'image';
        } else if (m.viewOnceMessage?.message?.videoMessage) {
            viewOnceContent = m.viewOnceMessage.message.videoMessage;
            mediaType = 'video';
        } else if (m.viewOnceMessageV2?.message?.imageMessage) {
            viewOnceContent = m.viewOnceMessageV2.message.imageMessage;
            mediaType = 'image';
        } else if (m.viewOnceMessageV2?.message?.videoMessage) {
            viewOnceContent = m.viewOnceMessageV2.message.videoMessage;
            mediaType = 'video';
        } else if (m.viewOnceMessageV2Extension?.message?.imageMessage) {
            viewOnceContent = m.viewOnceMessageV2Extension.message.imageMessage;
            mediaType = 'image';
        } else if (m.viewOnceMessageV2Extension?.message?.videoMessage) {
            viewOnceContent = m.viewOnceMessageV2Extension.message.videoMessage;
            mediaType = 'video';
        }

        if (!viewOnceContent || !mediaType) return false;

        console.log(`[ViewOnce] Detected ${mediaType} viewonce, downloading...`);

        // Download media - use the original message structure
        const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: sock.updateMediaMessage
            }
        );

        if (!buffer || buffer.length === 0) {
            console.log('[ViewOnce] Download failed - empty buffer');
            return false;
        }

        console.log(`[ViewOnce] Downloaded ${buffer.length} bytes`);

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

        const ownerJid = ownerNumber + '@s.whatsapp.net';

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

        console.log(`[ViewOnce] Saved and forwarded from ${senderNum}`);
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
