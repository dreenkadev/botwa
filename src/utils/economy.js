/**
 * Economy System - Virtual currency for bot users
 * Now with PERSISTENT storage to file
 */

const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '..', '..', 'database', 'economy.json');

let economy = {};

// Load economy data from file
function loadEconomy() {
    try {
        if (fs.existsSync(economyPath)) {
            const data = fs.readFileSync(economyPath, 'utf8');
            economy = JSON.parse(data);
        }
    } catch (err) {
        console.error('Economy load error:', err.message);
        economy = {};
    }
}

// Save economy data to file (debounced)
let saveTimeout = null;
function saveEconomy() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        try {
            // Ensure directory exists
            const dir = path.dirname(economyPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
        } catch (err) {
            console.error('Economy save error:', err.message);
        }
    }, 1000); // Debounce 1 second to avoid too many writes
}

/**
 * Get user balance
 */
function getBalance(userId) {
    if (!economy[userId]) {
        economy[userId] = {
            coins: 0,
            lastDaily: 0,
            totalEarned: 0
        };
        saveEconomy();
    }
    return economy[userId];
}

/**
 * Add coins to user
 */
function addCoins(userId, amount) {
    const user = getBalance(userId);
    user.coins += amount;
    user.totalEarned += amount;
    saveEconomy();
    return user.coins;
}

/**
 * Remove coins from user
 */
function removeCoins(userId, amount) {
    const user = getBalance(userId);
    if (user.coins < amount) return false;
    user.coins -= amount;
    saveEconomy();
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
 * Get leaderboard (top users)
 */
function getLeaderboard(limit = 10) {
    return Object.entries(economy)
        .map(([id, data]) => ({ userId: id, ...data }))
        .filter(u => u.coins > 0)
        .sort((a, b) => b.coins - a.coins)
        .slice(0, limit);
}

/**
 * Format coins with thousand separator
 */
function formatCoins(amount) {
    return amount.toLocaleString('id-ID');
}

// Initialize on module load
loadEconomy();

module.exports = {
    getBalance,
    addCoins,
    removeCoins,
    transferCoins,
    claimDaily,
    formatCoins,
    getLeaderboard,
    loadEconomy,
    saveEconomy
};
