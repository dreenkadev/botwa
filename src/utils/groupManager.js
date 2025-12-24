/**
 * Group rules storage
 */
const groupRules = new Map();

function setRules(groupId, rules) {
    groupRules.set(groupId, rules);
}

function getRules(groupId) {
    return groupRules.get(groupId) || null;
}

function deleteRules(groupId) {
    return groupRules.delete(groupId);
}

/**
 * Auto-response storage
 */
const autoResponses = new Map();

function setAutoResponse(groupId, trigger, response) {
    if (!autoResponses.has(groupId)) {
        autoResponses.set(groupId, new Map());
    }
    autoResponses.get(groupId).set(trigger.toLowerCase(), response);
}

function getAutoResponse(groupId, text) {
    const groupResponses = autoResponses.get(groupId);
    if (!groupResponses) return null;

    const textLower = text.toLowerCase();
    for (const [trigger, response] of groupResponses) {
        if (textLower.includes(trigger)) {
            return response;
        }
    }
    return null;
}

function getAllAutoResponses(groupId) {
    const groupResponses = autoResponses.get(groupId);
    if (!groupResponses) return [];
    return [...groupResponses.entries()].map(([trigger, response]) => ({ trigger, response }));
}

function deleteAutoResponse(groupId, trigger) {
    const groupResponses = autoResponses.get(groupId);
    if (!groupResponses) return false;
    return groupResponses.delete(trigger.toLowerCase());
}

/**
 * Scheduled messages
 */
const scheduledMessages = [];

function addScheduledMessage(chatId, message, executeAt, createdBy) {
    const id = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    scheduledMessages.push({
        id,
        chatId,
        message,
        executeAt,
        createdBy,
        createdAt: Date.now()
    });
    return id;
}

function getScheduledMessages(chatId = null) {
    if (chatId) {
        return scheduledMessages.filter(s => s.chatId === chatId);
    }
    return scheduledMessages;
}

function removeScheduledMessage(id) {
    const index = scheduledMessages.findIndex(s => s.id === id);
    if (index > -1) {
        scheduledMessages.splice(index, 1);
        return true;
    }
    return false;
}

/**
 * User statistics
 */
const userStats = new Map();

function incrementUserStat(userId, stat = 'messages') {
    if (!userStats.has(userId)) {
        userStats.set(userId, { messages: 0, commands: 0 });
    }
    const user = userStats.get(userId);
    user[stat] = (user[stat] || 0) + 1;
}

function getUserStats(userId) {
    return userStats.get(userId) || { messages: 0, commands: 0 };
}

function getLeaderboard(limit = 10) {
    const sorted = [...userStats.entries()]
        .sort((a, b) => b[1].messages - a[1].messages)
        .slice(0, limit);
    return sorted.map(([userId, stats]) => ({ userId, ...stats }));
}

module.exports = {
    setRules,
    getRules,
    deleteRules,
    setAutoResponse,
    getAutoResponse,
    getAllAutoResponses,
    deleteAutoResponse,
    addScheduledMessage,
    getScheduledMessages,
    removeScheduledMessage,
    incrementUserStat,
    getUserStats,
    getLeaderboard
};
