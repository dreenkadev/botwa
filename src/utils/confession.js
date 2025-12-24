/**
 * Confession System
 * Anonymous messaging system for groups
 */

// Store active confession sessions
const confessionSessions = new Map();

/**
 * Start a confession session for a user
 * @param {string} senderJid - User starting confession
 * @param {string} groupId - Target group ID
 * @param {string} groupName - Group name
 */
function startConfession(senderJid, groupId, groupName) {
    confessionSessions.set(senderJid, {
        groupId,
        groupName,
        startedAt: Date.now()
    });
}

/**
 * Get active confession session
 * @param {string} senderJid - User JID
 * @returns {object|null} Session data or null
 */
function getConfessionSession(senderJid) {
    const session = confessionSessions.get(senderJid);
    if (!session) return null;

    // Session expires after 10 minutes
    if (Date.now() - session.startedAt > 10 * 60 * 1000) {
        confessionSessions.delete(senderJid);
        return null;
    }

    return session;
}

/**
 * End confession session
 * @param {string} senderJid - User JID
 */
function endConfession(senderJid) {
    confessionSessions.delete(senderJid);
}

/**
 * Check if user has active confession session
 * @param {string} senderJid - User JID
 * @returns {boolean}
 */
function hasActiveSession(senderJid) {
    return getConfessionSession(senderJid) !== null;
}

module.exports = {
    startConfession,
    getConfessionSession,
    endConfession,
    hasActiveSession
};
