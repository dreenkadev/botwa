/**
 * Premium User Management System
 */

const premiumUsers = new Map();
const moderators = new Set();

/**
 * Check if user is premium
 */
function isPremium(userId) {
    const premium = premiumUsers.get(userId);
    if (!premium) return false;

    // Check expiry
    if (premium.expiry && Date.now() > premium.expiry) {
        premiumUsers.delete(userId);
        return false;
    }
    return true;
}

/**
 * Add premium user
 */
function addPremium(userId, days = 30, addedBy = 'owner') {
    const expiry = days === 0 ? null : Date.now() + (days * 24 * 60 * 60 * 1000);
    premiumUsers.set(userId, {
        since: Date.now(),
        expiry,
        addedBy,
        tier: 'premium'
    });
    return true;
}

/**
 * Remove premium user
 */
function removePremium(userId) {
    return premiumUsers.delete(userId);
}

/**
 * Get all premium users
 */
function getAllPremium() {
    const list = [];
    for (const [userId, data] of premiumUsers) {
        if (!data.expiry || Date.now() < data.expiry) {
            list.push({ userId, ...data });
        }
    }
    return list;
}

/**
 * Get premium info
 */
function getPremiumInfo(userId) {
    return premiumUsers.get(userId) || null;
}

/**
 * Check if user is moderator
 */
function isModerator(userId) {
    return moderators.has(userId);
}

/**
 * Add moderator
 */
function addModerator(userId) {
    moderators.add(userId);
    return true;
}

/**
 * Remove moderator
 */
function removeModerator(userId) {
    return moderators.delete(userId);
}

/**
 * Get all moderators
 */
function getAllModerators() {
    return [...moderators];
}

module.exports = {
    isPremium,
    addPremium,
    removePremium,
    getAllPremium,
    getPremiumInfo,
    isModerator,
    addModerator,
    removeModerator,
    getAllModerators
};
