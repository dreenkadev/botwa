/**
 * Economy System - Virtual currency for bot users
 */

const economy = new Map();

/**
 * Get user balance
 */
function getBalance(userId) {
    if (!economy.has(userId)) {
        economy.set(userId, {
            coins: 0,
            lastDaily: 0,
            totalEarned: 0
        });
    }
    return economy.get(userId);
}

/**
 * Add coins to user
 */
function addCoins(userId, amount) {
    const user = getBalance(userId);
    user.coins += amount;
    user.totalEarned += amount;
    return user.coins;
}

/**
 * Remove coins from user
 */
function removeCoins(userId, amount) {
    const user = getBalance(userId);
    if (user.coins < amount) return false;
    user.coins -= amount;
    return true;
}

/**
 * Transfer coins between users
 */
function transferCoins(fromId, toId, amount) {
    if (!removeCoins(fromId, amount)) return false;
    addCoins(toId, amount);
    return true;
}

/**
 * Check and claim daily reward
 */
function claimDaily(userId) {
    const user = getBalance(userId);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (now - user.lastDaily < oneDay) {
        const remaining = oneDay - (now - user.lastDaily);
        return { success: false, remaining };
    }

    const reward = Math.floor(Math.random() * 500) + 500; // 500-1000 coins
    user.lastDaily = now;
    addCoins(userId, reward);

    return { success: true, reward, newBalance: user.coins };
}

/**
 * Format coins with thousand separator
 */
function formatCoins(amount) {
    return amount.toLocaleString('id-ID');
}

module.exports = {
    getBalance,
    addCoins,
    removeCoins,
    transferCoins,
    claimDaily,
    formatCoins
};
