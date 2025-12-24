/**
 * Toxic Word Filter for Groups
 * - Detects and deletes messages containing toxic/bad words
 * - Sends warning to sender
 * - Only works in groups where bot is admin
 */

// Daftar kata toxic (mudah ditambah)
const TOXIC_WORDS = [
    // Indonesian
    'anjing', 'bangsat', 'bajingan', 'babi', 'kontol', 'memek', 'ngentot',
    'tolol', 'goblok', 'idiot', 'bodoh', 'tai', 'bego', 'kampret',
    'asu', 'jancok', 'dancok', 'cuk', 'jancuk', 'matamu', 'perek',
    'lonte', 'pelacur', 'sundal', 'keparat', 'sialan', 'setan',
    // English
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'bastard',
    'whore', 'slut', 'damn', 'cunt', 'nigger', 'faggot'
];

// Compile regex untuk performa
const toxicRegex = new RegExp(
    TOXIC_WORDS.map(word => `\\b${word}\\b`).join('|'),
    'i'
);

/**
 * Check if text contains toxic words
 * @param {string} text - Message text to check
 * @returns {boolean}
 */
function containsToxicWord(text) {
    if (!text || typeof text !== 'string') return false;
    return toxicRegex.test(text);
}

/**
 * Handle toxic message in group
 * @param {object} sock - Baileys socket
 * @param {object} msg - Message object
 * @param {string} chatId - Group ID
 * @param {string} senderId - Sender ID
 * @param {string} text - Message text
 * @returns {Promise<boolean>} - true if message was toxic and handled
 */
async function handleToxicFilter(sock, msg, chatId, senderId, text) {
    // Only check text messages
    if (!text) return false;

    // Check for toxic words
    if (!containsToxicWord(text)) return false;

    try {
        // Try to delete the message (requires bot to be admin)
        await sock.sendMessage(chatId, {
            delete: msg.key
        });

        // Send warning to sender
        const senderNum = senderId.split('@')[0];
        await sock.sendMessage(chatId, {
            text: `@${senderNum} Pesan dihapus karena mengandung kata tidak pantas.\n\n${require('../../config').signature}`,
            mentions: [senderId]
        });

        console.log(`[ToxicFilter] Deleted message from ${senderNum}`);
        return true;
    } catch (err) {
        // Bot mungkin bukan admin, skip saja
        console.log(`[ToxicFilter] Cannot delete: ${err.message}`);
        return false;
    }
}

/**
 * Check if toxic filter is enabled for group
 * @param {string} groupId 
 * @returns {boolean}
 */
function isToxicFilterEnabled(groupId) {
    const { getGroupSettings } = require('../utils/groupSettings');
    const settings = getGroupSettings(groupId);
    return settings.toxicFilter === true;
}

module.exports = {
    TOXIC_WORDS,
    containsToxicWord,
    handleToxicFilter,
    isToxicFilterEnabled
};
