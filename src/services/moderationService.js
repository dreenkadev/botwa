/**
 * Toxic Word Filter for Groups
 * - Detects and deletes messages containing toxic/bad words
 * - Sends warning to sender
 * - Only works in groups where bot is admin
 * - DOES NOT apply to group admins
 * - Words can be added/removed dynamically
 */

const fs = require('fs');
const path = require('path');

// Default toxic words
const DEFAULT_TOXIC_WORDS = [
    // Indonesian
    'anjing', 'bangsat', 'bajingan', 'babi', 'kontol', 'memek', 'ngentot',
    'tolol', 'goblok', 'idiot', 'bodoh', 'tai', 'bego', 'kampret',
    'asu', 'jancok', 'dancok', 'cuk', 'jancuk', 'matamu', 'perek',
    'lonte', 'pelacur', 'sundal', 'keparat', 'sialan', 'setan',
    // English
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard',
    'whore', 'slut', 'damn', 'cunt', 'nigger', 'faggot'
];

// Path for custom words
const customWordsPath = path.join(__dirname, '..', 'database', 'toxic_words.json');

// Load custom words
let customWords = [];
function loadCustomWords() {
    try {
        if (fs.existsSync(customWordsPath)) {
            customWords = JSON.parse(fs.readFileSync(customWordsPath, 'utf8'));
        }
    } catch { customWords = []; }
}

function saveCustomWords() {
    try {
        const dir = path.dirname(customWordsPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(customWordsPath, JSON.stringify(customWords, null, 2));
    } catch { }
}

// Get all toxic words (default + custom)
function getAllToxicWords() {
    loadCustomWords();
    return [...new Set([...DEFAULT_TOXIC_WORDS, ...customWords])];
}

// Add custom word
function addToxicWord(word) {
    loadCustomWords();
    const w = word.toLowerCase().trim();
    if (!customWords.includes(w)) {
        customWords.push(w);
        saveCustomWords();
        rebuildRegex();
        return true;
    }
    return false;
}

// Remove custom word
function removeToxicWord(word) {
    loadCustomWords();
    const w = word.toLowerCase().trim();
    const idx = customWords.indexOf(w);
    if (idx !== -1) {
        customWords.splice(idx, 1);
        saveCustomWords();
        rebuildRegex();
        return true;
    }
    return false;
}

// Get custom words only
function getCustomWords() {
    loadCustomWords();
    return customWords;
}

// Compile regex
let toxicRegex = null;
function rebuildRegex() {
    const words = getAllToxicWords();
    toxicRegex = new RegExp(
        words.map(word => `\\b${word}\\b`).join('|'),
        'i'
    );
}

// Initialize regex
loadCustomWords();
rebuildRegex();

// Cache group admins
const adminCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if text contains toxic words
 */
function containsToxicWord(text) {
    if (!text || typeof text !== 'string') return false;
    return toxicRegex.test(text);
}

/**
 * Get group admins (with cache)
 */
async function getGroupAdmins(sock, groupId) {
    const cached = adminCache.get(groupId);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
        return cached.admins;
    }

    try {
        const metadata = await sock.groupMetadata(groupId);
        const admins = metadata.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id);

        adminCache.set(groupId, { admins, time: Date.now() });
        return admins;
    } catch {
        return [];
    }
}

/**
 * Check if user is admin
 */
async function isGroupAdmin(sock, groupId, userId) {
    const admins = await getGroupAdmins(sock, groupId);
    return admins.includes(userId);
}

/**
 * Handle toxic message in group
 */
async function handleToxicFilter(sock, msg, chatId, senderId, text) {
    if (!text) return false;

    if (!containsToxicWord(text)) return false;

    // Skip if sender is admin
    const isAdmin = await isGroupAdmin(sock, chatId, senderId);
    if (isAdmin) return false;

    try {
        await sock.sendMessage(chatId, { delete: msg.key });

        const senderNum = senderId.split('@')[0];
        await sock.sendMessage(chatId, {
            text: `@${senderNum} pesan dihapus karena mengandung kata tidak pantas.\n\n${require('../../config').signature}`,
            mentions: [senderId]
        });

        console.log(`[ToxicFilter] Deleted message from ${senderNum}`);
        return true;
    } catch (err) {
        console.log(`[ToxicFilter] Cannot delete: ${err.message}`);
        return false;
    }
}

/**
 * Check if toxic filter is enabled for group
 */
function isToxicFilterEnabled(groupId) {
    const { getGroupSettings } = require('../utils/groupSettings');
    const settings = getGroupSettings(groupId);
    return settings.toxicFilter === true;
}

module.exports = {
    DEFAULT_TOXIC_WORDS,
    containsToxicWord,
    handleToxicFilter,
    isToxicFilterEnabled,
    isGroupAdmin,
    getAllToxicWords,
    getCustomWords,
    addToxicWord,
    removeToxicWord
};
