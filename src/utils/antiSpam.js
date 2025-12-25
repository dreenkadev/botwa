/**
 * Anti-Spam System - Prevents command abuse
 * Uses sliding window rate limiting
 */

const config = require('../../config');

// Store command timestamps per user
const userCommands = new Map();

// Config
const WINDOW_MS = 10000;      // 10 second window
const MAX_COMMANDS = 5;       // Max 5 commands per window
const COOLDOWN_MS = 30000;    // 30 second cooldown when rate limited

/**
 * Check if user is spamming
 * @param {string} userId - User ID to check
 * @returns {{ blocked: boolean, message?: string, remaining?: number }}
 */
function checkSpam(userId) {
    // Owner bypass
    if (userId === config.ownerNumber) {
        return { blocked: false };
    }

    const now = Date.now();
    let userData = userCommands.get(userId);

    if (!userData) {
        userData = {
            timestamps: [],
            blockedUntil: 0
        };
        userCommands.set(userId, userData);
    }

    // Check if user is in cooldown
    if (userData.blockedUntil > now) {
        const remaining = Math.ceil((userData.blockedUntil - now) / 1000);
        return {
            blocked: true,
            message: `⏳ Spam detected! Wait ${remaining}s`,
            remaining
        };
    }

    // Clean old timestamps outside window
    userData.timestamps = userData.timestamps.filter(t => now - t < WINDOW_MS);

    // Check rate limit
    if (userData.timestamps.length >= MAX_COMMANDS) {
        userData.blockedUntil = now + COOLDOWN_MS;
        return {
            blocked: true,
            message: `⏳ Too fast! Wait 30s`,
            remaining: 30
        };
    }

    // Add current timestamp
    userData.timestamps.push(now);

    return { blocked: false };
}

/**
 * Reset user cooldown
 * @param {string} userId - User ID to reset
 */
function resetCooldown(userId) {
    const userData = userCommands.get(userId);
    if (userData) {
        userData.blockedUntil = 0;
        userData.timestamps = [];
    }
}

/**
 * Cleanup old entries periodically
 */
function cleanup() {
    const now = Date.now();
    for (const [userId, userData] of userCommands) {
        // Remove users with no recent activity
        if (userData.timestamps.length === 0 && userData.blockedUntil < now) {
            userCommands.delete(userId);
        }
    }
}

// Cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

module.exports = { checkSpam, resetCooldown };
