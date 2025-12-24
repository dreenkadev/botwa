/**
 * Owner Activity Auto-Reply for Private Chats
 * - Tracks owner's last activity
 * - Auto-replies to users when owner is inactive
 * - Prevents spam with reply limits
 */

const config = require('../../config');

// State storage (in-memory)
let ownerLastActive = Date.now();
const userReplyState = new Map(); // userId -> { count: number, lastReply: timestamp }

// Constants
const INACTIVE_30_MIN = 30 * 60 * 1000;  // 30 minutes
const INACTIVE_1_HOUR = 60 * 60 * 1000;  // 1 hour
const MAX_AUTO_REPLIES = 2;

/**
 * Update owner's last active time
 * Called when owner sends any message
 */
function updateOwnerActivity() {
    ownerLastActive = Date.now();
    // Reset all user reply states when owner becomes active
    userReplyState.clear();
    console.log('[OwnerActivity] Owner is now active, states reset');
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

    // First auto-reply: Owner inactive >= 30 minutes
    if (state.count === 0 && inactiveTime >= INACTIVE_30_MIN) {
        try {
            await sock.sendMessage(chatId, {
                text: `Halo, pesan kamu sudah diterima. Owner belum aktif selama ±30 menit terakhir.\n\n${config.signature}`
            });

            state.count = 1;
            state.lastReply = Date.now();
            userReplyState.set(senderId, state);

            console.log(`[AutoReply] Sent 30min reply to ${senderId.split('@')[0]}`);
            return true;
        } catch (err) {
            console.log(`[AutoReply] Failed: ${err.message}`);
            return false;
        }
    }

    // Second auto-reply: Owner inactive >= 1 hour AND user already got first reply
    if (state.count === 1 && inactiveTime >= INACTIVE_1_HOUR) {
        try {
            await sock.sendMessage(chatId, {
                text: `Terima kasih atas pesan kamu. Owner sedang tidak aktif cukup lama.\n\n${config.signature}`
            });

            state.count = 2;
            state.lastReply = Date.now();
            userReplyState.set(senderId, state);

            console.log(`[AutoReply] Sent 1hour reply to ${senderId.split('@')[0]}`);
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
    INACTIVE_30_MIN,
    INACTIVE_1_HOUR
};
