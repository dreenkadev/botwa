const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database', 'users.json');

let db = {
    users: {},
    blacklist: [],
    stats: {
        totalCommands: 0,
        startTime: null
    }
};

function initDatabase() {
    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            db = JSON.parse(data);
        }
        db.stats.startTime = Date.now();
        saveDatabase();
    } catch (err) {
        console.error('Database init error:', err.message);
    }
}

function saveDatabase() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    } catch (err) {
        console.error('Database save error:', err.message);
    }
}

function getUser(userId) {
    if (!db.users[userId]) {
        db.users[userId] = {
            id: userId,
            commandCount: 0,
            firstSeen: Date.now(),
            lastCommand: 0,
            warnings: 0,
            blockedUntil: 0
        };
        saveDatabase();
    }
    return db.users[userId];
}

function updateUser(userId, data) {
    db.users[userId] = { ...getUser(userId), ...data };
    saveDatabase();
}

function incrementCommandCount(userId) {
    const user = getUser(userId);
    user.commandCount++;
    db.stats.totalCommands++;
    saveDatabase();
}

function isBlacklisted(userId) {
    return db.blacklist.includes(userId);
}

function addToBlacklist(userId) {
    if (!db.blacklist.includes(userId)) {
        db.blacklist.push(userId);
        saveDatabase();
    }
}

function removeFromBlacklist(userId) {
    db.blacklist = db.blacklist.filter(id => id !== userId);
    saveDatabase();
}

function getStats() {
    return {
        ...db.stats,
        userCount: Object.keys(db.users).length,
        blacklistCount: db.blacklist.length
    };
}

function getAllUsers() {
    return db.users;
}

module.exports = {
    initDatabase,
    saveDatabase,
    getUser,
    updateUser,
    incrementCommandCount,
    isBlacklisted,
    addToBlacklist,
    removeFromBlacklist,
    getStats,
    getAllUsers
};
