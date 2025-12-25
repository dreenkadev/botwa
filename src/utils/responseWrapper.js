// Bot Response Wrapper - Auto-append signature to all text messages
const config = require('../../config');

const SIGNATURE = config.signature || '𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃';

/**
 * Clean existing signature from text to prevent duplicates
 */
function cleanSignature(text) {
    if (!text || typeof text !== 'string') return text;
    // Remove existing signature (with various patterns)
    return text
        .replace(/\n*𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃$/g, '')
        .replace(/\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃$/g, '')
        .replace(/𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃$/g, '')
        .trim();
}

/**
 * Add signature to text
 */
function addSignature(text) {
    if (!text || typeof text !== 'string') return text;
    const cleaned = cleanSignature(text);
    return `${cleaned}\n\n${SIGNATURE}`;
}

/**
 * Wrap sock.sendMessage to auto-append signature to text messages
 * @param {object} sock - The WhatsApp socket
 * @returns {object} - Wrapped socket with modified sendMessage
 */
function wrapSocket(sock) {
    const originalSendMessage = sock.sendMessage.bind(sock);

    sock.sendMessage = async (jid, content, options) => {
        // Auto-add signature to text messages
        if (content && content.text && typeof content.text === 'string') {
            content.text = addSignature(content.text);
        }

        // Auto-add signature to caption (images/videos)
        if (content && content.caption && typeof content.caption === 'string') {
            content.caption = addSignature(content.caption);
        }

        return originalSendMessage(jid, content, options);
    };

    return sock;
}

module.exports = { wrapSocket, addSignature, cleanSignature, SIGNATURE };
