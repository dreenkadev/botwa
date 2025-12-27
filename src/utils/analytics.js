// Group Analytics - Track message stats per group
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'database', 'analytics.json');
let analyticsData = {};

function loadData() {
    try {
        if (fs.existsSync(dataPath)) {
            analyticsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }
    } catch { analyticsData = {}; }
}

function saveData() {
    try {
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataPath, JSON.stringify(analyticsData, null, 2));
    } catch { }
}

function getGroupData(groupId) {
    loadData();
    if (!analyticsData[groupId]) {
        analyticsData[groupId] = {
            users: {},
            hourly: {},
            daily: {},
            totalMessages: 0
        };
    }
    return analyticsData[groupId];
}

/**
 * Track a message
 */
function trackMessage(groupId, userId) {
    const group = getGroupData(groupId);
    const now = new Date();
    const hour = now.getHours().toString();
    const day = now.toISOString().split('T')[0];

    // Track user
    if (!group.users[userId]) {
        group.users[userId] = { count: 0, lastMessage: 0 };
    }
    group.users[userId].count++;
    group.users[userId].lastMessage = Date.now();

    // Track hourly
    group.hourly[hour] = (group.hourly[hour] || 0) + 1;

    // Track daily
    group.daily[day] = (group.daily[day] || 0) + 1;

    // Total
    group.totalMessages++;

    analyticsData[groupId] = group;

    // Debounce save
    if (!analyticsData._saveTimeout) {
        analyticsData._saveTimeout = setTimeout(() => {
            delete analyticsData._saveTimeout;
            saveData();
        }, 5000);
    }
}

/**
 * Get most active users in group
 */
function getMostActive(groupId, limit = 10) {
    const group = getGroupData(groupId);
    return Object.entries(group.users)
        .map(([userId, data]) => ({ userId, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

/**
 * Get peak hours
 */
function getPeakHours(groupId) {
    const group = getGroupData(groupId);
    return Object.entries(group.hourly)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Get daily stats for last N days
 */
function getDailyStats(groupId, days = 7) {
    const group = getGroupData(groupId);
    const result = [];

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const day = date.toISOString().split('T')[0];
        result.push({
            date: day,
            count: group.daily[day] || 0
        });
    }

    return result.reverse();
}

/**
 * Get group summary
 */
function getGroupSummary(groupId) {
    const group = getGroupData(groupId);
    const peakHours = getPeakHours(groupId);
    const mostActive = getMostActive(groupId, 5);
    const dailyStats = getDailyStats(groupId, 7);

    const todayCount = dailyStats[dailyStats.length - 1]?.count || 0;
    const weekTotal = dailyStats.reduce((sum, d) => sum + d.count, 0);

    return {
        totalMessages: group.totalMessages,
        todayMessages: todayCount,
        weekMessages: weekTotal,
        peakHour: peakHours[0]?.hour ?? null,
        mostActiveUser: mostActive[0]?.userId ?? null,
        mostActiveCount: mostActive[0]?.count ?? 0
    };
}

loadData();

module.exports = {
    trackMessage,
    getMostActive,
    getPeakHours,
    getDailyStats,
    getGroupSummary
};
