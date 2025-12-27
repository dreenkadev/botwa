const config = require('../../config');
const fs = require('fs');
const path = require('path');
const { wrapSocket } = require('../utils/responseWrapper');

const CATEGORIES = ['general', 'owner', 'group', 'moderation', 'media', 'utility', 'fun', 'ai'];
const commandsBaseDir = path.join(__dirname, '..', 'commands');
const commands = new Map();
const commandsByCategory = new Map();
let commandsLoaded = false;

// cache admin status - reduce API calls
const adminCache = new Map();
const ADMIN_CACHE_TTL = 60000;

// Owner LID storage
const ownerLidPath = path.join(__dirname, '..', 'database', 'owner_lid.json');
let ownerLid = null;

function loadOwnerLid() {
    try {
        if (fs.existsSync(ownerLidPath)) {
            const data = JSON.parse(fs.readFileSync(ownerLidPath, 'utf8'));
            ownerLid = data.lid;
        }
    } catch { }
}

function saveOwnerLid(lid) {
    try {
        const dir = path.dirname(ownerLidPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(ownerLidPath, JSON.stringify({ lid, savedAt: new Date().toISOString() }));
        ownerLid = lid;
    } catch { }
}

// Check if sender is owner (supports both phone and LID format)
function isOwnerCheck(senderId) {
    const phoneNumber = config.ownerNumber;
    const configLid = config.ownerLid;
    const senderBase = senderId.replace(/@.*$/, ''); // Remove @s.whatsapp.net or @lid

    // Check phone number match
    if (senderBase === phoneNumber) return true;

    // Check LID from config
    if (configLid && senderBase === configLid) return true;

    // Check LID from saved file
    loadOwnerLid();
    if (ownerLid && senderBase === ownerLid) return true;

    return false;
}

loadOwnerLid();

function loadCommands() {
    if (commandsLoaded) return;

    let total = 0;
    for (const category of CATEGORIES) {
        const catPath = path.join(commandsBaseDir, category);
        if (!fs.existsSync(catPath)) continue;

        const files = fs.readdirSync(catPath).filter(f => f.endsWith('.js'));
        const catCmds = [];

        for (const file of files) {
            try {
                const cmd = require(path.join(catPath, file));
                if (cmd?.name) {
                    cmd.category = category;
                    commands.set(cmd.name, cmd);
                    catCmds.push(cmd);
                    total++;
                    if (cmd.aliases) cmd.aliases.forEach(a => commands.set(a, cmd));
                }
            } catch (err) {
                console.error(`Load fail ${category}/${file}:`, err.message);
            }
        }
        commandsByCategory.set(category, catCmds);
    }

    commandsLoaded = true;
    console.log(`[Commands] ${total} commands loaded`);
}

async function handleCommand(sock, msg, context) {
    const { text, senderId, chatId, isGroup, isOwner, quotedMsg, mediaMessage } = context;

    const args = text.slice(config.prefix.length).trim().split(/\s+/);
    const cmdName = args.shift().toLowerCase();
    const cmd = commands.get(cmdName);

    if (!cmd) return;

    // Wrap socket untuk auto-append signature (kecuali command yang noSignature)
    const wrappedSock = cmd.noSignature ? sock : wrapSocket(sock);

    // Use enhanced owner check (supports LID format)
    const isOwnerEnhanced = isOwner || isOwnerCheck(senderId);

    // Special command: register LID for owner
    if (cmdName === 'registerowner' && isOwner) {
        saveOwnerLid(senderId.replace(/@.*$/, ''));
        wrappedSock.sendMessage(chatId, { text: `owner lid registered: ${senderId}` }, { quoted: msg }).catch(() => { });
        return;
    }

    // permission checks - fast
    if (cmd.ownerOnly && !isOwnerEnhanced) {
        wrappedSock.sendMessage(chatId, { text: 'owner only' }, { quoted: msg }).catch(() => { });
        return;
    }

    if (cmd.groupOnly && !isGroup) {
        wrappedSock.sendMessage(chatId, { text: 'group only' }, { quoted: msg }).catch(() => { });
        return;
    }

    if (cmd.adminOnly && isGroup && !isOwner) {
        const isAdmin = await checkAdminCached(sock, chatId, senderId);
        if (!isAdmin) {
            wrappedSock.sendMessage(chatId, { text: 'admin only' }, { quoted: msg }).catch(() => { });
            return;
        }
    }

    // extract quoted text
    let quotedText = null;
    if (quotedMsg) {
        quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || null;
    }

    // Check if sender is admin (for commands that need it)
    let isAdmin = false;
    if (isGroup) {
        isAdmin = await checkAdminCached(sock, chatId, senderId);
    }

    // execute command with wrapped socket
    try {
        await cmd.execute(wrappedSock, msg, {
            args, senderId, chatId, isGroup, isOwner, isAdmin,
            quotedMsg, quotedText, mediaMessage, prefix: config.prefix
        });
    } catch (err) {
        console.error(`[${cmdName}]`, err.message);
        wrappedSock.sendMessage(chatId, { text: 'error' }, { quoted: msg }).catch(() => { });
    }
}

async function checkAdminCached(sock, groupId, participantId) {
    // Normalize participantId - ensure it has @s.whatsapp.net suffix
    const normalizedId = participantId.includes('@')
        ? participantId
        : `${participantId}@s.whatsapp.net`;

    const key = `${groupId}_${normalizedId}`;
    const cached = adminCache.get(key);
    if (cached && Date.now() - cached.time < ADMIN_CACHE_TTL) return cached.value;

    try {
        const meta = await sock.groupMetadata(groupId);

        // Check if participant is admin (handle both ID formats)
        const isAdmin = meta.participants.some(p => {
            const pId = p.id;
            const pIdBase = pId.split('@')[0];
            const searchIdBase = normalizedId.split('@')[0];

            return pIdBase === searchIdBase &&
                (p.admin === 'admin' || p.admin === 'superadmin');
        });

        adminCache.set(key, { value: isAdmin, time: Date.now() });
        return isAdmin;
    } catch (err) {
        console.log('[AdminCheck] Error:', err.message);
        return false;
    }
}

function getCommandsList() {
    const unique = new Map();
    for (const [, cmd] of commands) {
        if (!unique.has(cmd.name)) unique.set(cmd.name, cmd);
    }
    return Array.from(unique.values());
}

function getCommandsByCategory() { return commandsByCategory; }
function getCategories() { return CATEGORIES; }

loadCommands();

module.exports = { handleCommand, getCommandsList, getCommandsByCategory, getCategories, loadCommands };
