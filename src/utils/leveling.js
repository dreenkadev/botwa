// Leveling System - XP, Levels, Rewards
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'database', 'levels.json');
let levelData = {};

// XP thresholds for each level
const LEVEL_THRESHOLDS = [
    0,      // Level 0
    100,    // Level 1
    300,    // Level 2
    600,    // Level 3
    1000,   // Level 4
    1500,   // Level 5
    2100,   // Level 6
    2800,   // Level 7
    3600,   // Level 8
    4500,   // Level 9
    5500,   // Level 10
    6600,   // Level 11
    7800,   // Level 12
    9100,   // Level 13
    10500,  // Level 14
    12000,  // Level 15
    13600,  // Level 16
    15300,  // Level 17
    17100,  // Level 18
    19000,  // Level 19
    21000   // Level 20
];

// XP rewards
const XP_PER_MESSAGE = 5;
const XP_PER_COMMAND = 10;
const XP_COOLDOWN = 60000; // 1 minute cooldown

// Level up coin rewards
const COINS_PER_LEVEL = 50;

function loadData() {
    try {
        if (fs.existsSync(dataPath)) {
            levelData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch { levelData = {}; }
}

function saveData() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(levelData, null, 2));
    } catch { }
}

function getUserData(odId) {
    loadData();
    if (!levelData[odId]) {
        levelData[odId] = { xp: 0, level: 0, lastXpTime: 0, totalMessages: 0 };
    }
    return levelData[odId];
}

function calculateLevel(xp) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) return i;
    }
    return 0;
}

function getXpForNextLevel(level) {
    if (level >= LEVEL_THRESHOLDS.length - 1) return null;
    return LEVEL_THRESHOLDS[level + 1];
}

/**
 * Add XP to user
 * @returns {object} { xpGained, newXp, leveledUp, newLevel, coinsEarned }
 */
function addXp(userId, amount = XP_PER_MESSAGE) {
    const user = getUserData(userId);
    const now = Date.now();

    // Check cooldown
    if (now - user.lastXpTime < XP_COOLDOWN) {
        return { xpGained: 0, newXp: user.xp, leveledUp: false };
    }

    const oldLevel = user.level;
    user.xp += amount;
    user.lastXpTime = now;
    user.totalMessages++;

    const newLevel = calculateLevel(user.xp);
    const leveledUp = newLevel > oldLevel;

    let coinsEarned = 0;
    if (leveledUp) {
        user.level = newLevel;
        coinsEarned = (newLevel - oldLevel) * COINS_PER_LEVEL;
    }

    levelData[userId] = user;
    saveData();

    return {
        xpGained: amount,
        newXp: user.xp,
        leveledUp,
        newLevel,
        oldLevel,
        coinsEarned
    };
}

function getLeaderboard(limit = 10) {
    loadData();
    return Object.entries(levelData)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit);
}

function getRank(userId) {
    loadData();
    const sorted = Object.entries(levelData)
        .sort((a, b) => b[1].xp - a[1].xp);
    const index = sorted.findIndex(([id]) => id === odId);
    return index === -1 ? null : index + 1;
}

function setXp(userId, xp) {
    const user = getUserData(userId);
    user.xp = xp;
    user.level = calculateLevel(xp);
    levelData[userId] = user;
    saveData();
}

loadData();

module.exports = {
    addXp,
    getUserData,
    getLeaderboard,
    getRank,
    setXp,
    calculateLevel,
    getXpForNextLevel,
    XP_PER_MESSAGE,
    XP_PER_COMMAND,
    LEVEL_THRESHOLDS,
    COINS_PER_LEVEL
};
