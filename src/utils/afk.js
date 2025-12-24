/**
 * AFK (Away From Keyboard) System
 * Tracks user AFK status and auto-replies when mentioned
 */

const afkUsers = new Map();

/**
 * Set user AFK status
 * @param {string} userId - User ID
 * @param {string} reason - AFK reason
 */
function setAfk(userId, reason = 'AFK') {
    afkUsers.set(userId, {
        reason,
        since: Date.now()
    });
}

/**
 * Remove user from AFK
 * @param {string} userId - User ID
 * @returns {object|null} Previous AFK data or null
 */
function removeAfk(userId) {
    const data = afkUsers.get(userId);
    if (data) {
        afkUsers.delete(userId);
        return data;
    }
    return null;
}

/**
 * Check if user is AFK
 * @param {string} userId - User ID
 * @returns {object|null} AFK data or null
 */
function getAfk(userId) {
    return afkUsers.get(userId) || null;
}

/**
 * Get all AFK users
 * @returns {Map} All AFK users
 */
function getAllAfk() {
    return afkUsers;
}

/**
 * Format duration since AFK
 * @param {number} timestamp - AFK start timestamp
 * @returns {string} Formatted duration
 */
function formatAfkDuration(timestamp) {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari ${hours % 24} jam`;
    if (hours > 0) return `${hours} jam ${minutes % 60} menit`;
    if (minutes > 0) return `${minutes} menit`;
    return `${seconds} detik`;
}

module.exports = {
    setAfk,
    removeAfk,
    getAfk,
    getAllAfk,
    formatAfkDuration
};
