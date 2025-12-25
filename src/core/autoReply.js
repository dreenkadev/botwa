/**
 * Owner Activity Auto-Reply for Private Chats
 * - Tracks owner's last activity
 * - Auto-replies to users when owner is inactive
 * - Custom message for special contacts (girlfriend)
 * - Prevents spam with reply limits
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');

// State storage (in-memory)
let ownerLastActive = Date.now();
const userReplyState = new Map(); // userId -> { count: number, lastReply: timestamp }

// Special contacts config path
const specialContactsPath = path.join(__dirname, '..', 'database', 'special_contacts.json');

// Constants
const INACTIVE_30_MIN = 30 * 60 * 1000;  // 30 minutes
const INACTIVE_1_HOUR = 60 * 60 * 1000;  // 1 hour
const MAX_AUTO_REPLIES = 2;

// Load special contacts
let specialContacts = {};
function loadSpecialContacts() {
    try {
        if (fs.existsSync(specialContactsPath)) {
            specialContacts = JSON.parse(fs.readFileSync(specialContactsPath, 'utf8'));
        }
    } catch { specialContacts = {}; }
}

function saveSpecialContacts() {
    try {
        const dir = path.dirname(specialContactsPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(specialContactsPath, JSON.stringify(specialContacts, null, 2));
    } catch { }
}

/**
 * Set custom message for a special contact
 */
function setSpecialContact(number, name, customMessage) {
    loadSpecialContacts();
    specialContacts[number] = { name, customMessage };
    saveSpecialContacts();
}

/**
 * Remove special contact
 */
function removeSpecialContact(number) {
    loadSpecialContacts();
    delete specialContacts[number];
    saveSpecialContacts();
}

/**
 * Get special contact message
 */
function getSpecialContactMessage(number) {
    loadSpecialContacts();
    return specialContacts[number] || null;
}

/**
 * Get all special contacts
 */
function getSpecialContacts() {
    loadSpecialContacts();
    return specialContacts;
}

/**
 * Update owner's last active time
 * Called when owner sends any message
 */
function updateOwnerActivity() {
    ownerLastActive = Date.now();
    // Reset all user reply states when owner becomes active
    userReplyState.clear();
}

/**
 * Get how long owner has been inactive (in ms)
 * @returns {number}
 */
function getOwnerInactiveTime() {
    return Date.now() - ownerLastActive;
}

/**
 * Check if owner is inactive for specified duration
 * @param {number} duration - Duration in ms
 * @returns {boolean}
 */
function isOwnerInactive(duration) {
    return getOwnerInactiveTime() >= duration;
}

/**
 * Format inactive time to human readable
 */
function formatInactiveTime(ms) {
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''}`;
    const hours = Math.floor(mins / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Handle auto-reply for private chat
 * @param {object} sock - Baileys socket
 * @param {string} chatId - Chat ID (private)
 * @param {string} senderId - Sender ID
 * @returns {Promise<boolean>} - true if auto-reply was sent
 */
async function handleOwnerAutoReply(sock, chatId, senderId) {
    // Get user's reply state
    let state = userReplyState.get(senderId);
    if (!state) {
        state = { count: 0, lastReply: 0 };
        userReplyState.set(senderId, state);
    }

    // Already sent max replies, don't reply anymore
    if (state.count >= MAX_AUTO_REPLIES) {
        return false;
    }

    const inactiveTime = getOwnerInactiveTime();
    const senderNumber = senderId.split('@')[0];

    // Check if special contact
    const specialContact = getSpecialContactMessage(senderNumber);

    // First auto-reply: Owner inactive >= 30 minutes
    if (state.count === 0 && inactiveTime >= INACTIVE_30_MIN) {
        try {
            // Base message (same for everyone)
            let message = `Alert: ${config.ownerName || 'Owner'} hasn't interacted with the device for 30 minutes.`;

            // Add custom message for special contact
            if (specialContact && specialContact.customMessage) {
                message += `\n\n${specialContact.customMessage}`;
            }

            message += `\n\n${config.signature}`;

            await sock.sendMessage(chatId, { text: message });

            state.count = 1;
            state.lastReply = Date.now();
            userReplyState.set(senderId, state);
            return true;
        } catch (err) {
            console.log(`[AutoReply] Failed: ${err.message}`);
            return false;
        }
    }

    // Second auto-reply: Owner inactive >= 1 hour AND user already got first reply
    if (state.count === 1 && inactiveTime >= INACTIVE_1_HOUR) {
        try {
            // Base message (same for everyone)
            let message = `Alert: ${config.ownerName || 'Owner'} hasn't interacted with the device for 1 hour.`;

            // Add custom message for special contact
            if (specialContact && specialContact.customMessage) {
                message += `\n\n${specialContact.customMessage}`;
            }

            message += `\n\n${config.signature}`;

            await sock.sendMessage(chatId, { text: message });

            state.count = 2;
            state.lastReply = Date.now();
            userReplyState.set(senderId, state);
            return true;
        } catch (err) {
            console.log(`[AutoReply] Failed: ${err.message}`);
            return false;
        }
    }

    return false;
}

/**
 * Get owner number from config
 * @returns {string}
 */
function getOwnerNumber() {
    return config.ownerNumber;
}

/**
 * Check if sender is the owner
 * @param {string} senderId 
 * @returns {boolean}
 */
function isOwner(senderId) {
    const num = senderId.split('@')[0];
    return num === config.ownerNumber;
}

module.exports = {
    updateOwnerActivity,
    getOwnerInactiveTime,
    isOwnerInactive,
    handleOwnerAutoReply,
    getOwnerNumber,
    isOwner,
    setSpecialContact,
    removeSpecialContact,
    getSpecialContactMessage,
    getSpecialContacts,
    INACTIVE_30_MIN,
    INACTIVE_1_HOUR
};
