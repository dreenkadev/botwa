/**
 * Owner Activity Auto-Reply for Private Chats
 * - Tracks owner's last activity
 * - Auto-replies to users when owner is inactive
 * - Custom message for special contacts
 * - Sends BOTH 30min AND 1hour messages when owner is away 1+ hour
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');

// State storage (in-memory)
let ownerLastActive = Date.now();
const userReplyState = new Map(); // userId -> { sent30min, sent1hour, lastReply }

// Special contacts config path
const specialContactsPath = path.join(__dirname, '..', 'database', 'special_contacts.json');

// Constants
const INACTIVE_30_MIN = 30 * 60 * 1000;  // 30 minutes
const INACTIVE_1_HOUR = 60 * 60 * 1000;  // 1 hour

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

function setSpecialContact(number, name, customMessage) {
    loadSpecialContacts();
    specialContacts[number] = { name, customMessage };
    saveSpecialContacts();
}

function removeSpecialContact(number) {
    loadSpecialContacts();
    delete specialContacts[number];
    saveSpecialContacts();
}

function getSpecialContactMessage(number) {
    loadSpecialContacts();
    return specialContacts[number] || null;
}

function getSpecialContacts() {
    loadSpecialContacts();
    return specialContacts;
}

/**
 * Update owner's last active time
 */
function updateOwnerActivity() {
    ownerLastActive = Date.now();
    userReplyState.clear();
}

function getOwnerInactiveTime() {
    return Date.now() - ownerLastActive;
}

function isOwnerInactive(duration) {
    return getOwnerInactiveTime() >= duration;
}

/**
 * Handle auto-reply for private chat
 * FIXED: Both 30min and 1hour messages sent when owner is away 1+ hour
 */
async function handleOwnerAutoReply(sock, chatId, senderId) {
    let state = userReplyState.get(senderId);
    if (!state) {
        state = { sent30min: false, sent1hour: false, lastReply: 0 };
        userReplyState.set(senderId, state);
    }

    const inactiveTime = getOwnerInactiveTime();
    const senderNumber = senderId.split('@')[0];
    const specialContact = getSpecialContactMessage(senderNumber);

    let sentAny = false;

    // 30 minute notification
    if (!state.sent30min && inactiveTime >= INACTIVE_30_MIN) {
        try {
            let message = `Alert: ${config.ownerName || 'Owner'} hasn't interacted with the device for 30 minutes.`;
            if (specialContact?.customMessage) {
                message += `\n\n${specialContact.customMessage}`;
            }
            message += `\n\n${config.signature}`;

            await sock.sendMessage(chatId, { text: message });
            state.sent30min = true;
            state.lastReply = Date.now();
            sentAny = true;
        } catch (err) {
            console.log(`[AutoReply] 30min failed: ${err.message}`);
        }
    }

    // 1 hour notification (separate check)
    if (!state.sent1hour && inactiveTime >= INACTIVE_1_HOUR) {
        try {
            let message = `Alert: ${config.ownerName || 'Owner'} hasn't interacted with the device for 1 hour.`;
            if (specialContact?.customMessage) {
                message += `\n\n${specialContact.customMessage}`;
            }
            message += `\n\n${config.signature}`;

            await sock.sendMessage(chatId, { text: message });
            state.sent1hour = true;
            state.lastReply = Date.now();
            sentAny = true;
        } catch (err) {
            console.log(`[AutoReply] 1hour failed: ${err.message}`);
        }
    }

    userReplyState.set(senderId, state);
    return sentAny;
}

function getOwnerNumber() {
    return config.ownerNumber;
}

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
