// Bot Response Wrapper - Auto-append signature to all text messages
// IMPORTANT: This creates a PROXY that preserves ALL original socket methods
const config = require('../../config');

const SIGNATURE = config.signature || '𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃';

function cleanSignature(text) {
    if (!text || typeof text !== 'string') return text;
    return text
        .replace(/\n*𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃$/g, '')
        .replace(/\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃$/g, '')
        .replace(/𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃$/g, '')
        .trim();
}

function addSignature(text) {
    if (!text || typeof text !== 'string') return text;
    const cleaned = cleanSignature(text);
    return `${cleaned}\n\n${SIGNATURE}`;
}

/**
 * Wrap sock.sendMessage to auto-append signature
 * Uses Proxy to preserve ALL other socket methods (downloadMediaMessage, etc.)
 */
function wrapSocket(sock) {
    const originalSendMessage = sock.sendMessage.bind(sock);

    // Create a wrapped sendMessage
    const wrappedSendMessage = async (jid, content, options) => {
        if (content?.text && typeof content.text === 'string') {
            content.text = addSignature(content.text);
        }
        if (content?.caption && typeof content.caption === 'string') {
            content.caption = addSignature(content.caption);
        }
        return originalSendMessage(jid, content, options);
    };

    // Use Proxy to intercept only sendMessage, pass everything else through
    return new Proxy(sock, {
        get(target, prop) {
            if (prop === 'sendMessage') {
                return wrappedSendMessage;
            }
            // Return original method/property for everything else
            const value = target[prop];
            if (typeof value === 'function') {
                return value.bind(target);
            }
            return value;
        }
    });
}

module.exports = { wrapSocket, addSignature, cleanSignature, SIGNATURE };
