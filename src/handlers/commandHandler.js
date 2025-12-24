const config = require('../../config');
const fs = require('fs');
const path = require('path');

const CATEGORIES = ['general', 'owner', 'group', 'moderation', 'media', 'utility', 'fun', 'ai'];
const commandsBaseDir = path.join(__dirname, '..', 'commands');
const commands = new Map();
const commandsByCategory = new Map();
let commandsLoaded = false;

// cache admin status - reduce API calls
const adminCache = new Map();
const ADMIN_CACHE_TTL = 60000;

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

    // permission checks - fast
    if (cmd.ownerOnly && !isOwner) {
        sock.sendMessage(chatId, { text: 'owner only' }, { quoted: msg }).catch(() => { });
        return;
    }

    if (cmd.groupOnly && !isGroup) {
        sock.sendMessage(chatId, { text: 'group only' }, { quoted: msg }).catch(() => { });
        return;
    }

    if (cmd.adminOnly && isGroup && !isOwner) {
        const isAdmin = await checkAdminCached(sock, chatId, senderId);
        if (!isAdmin) {
            sock.sendMessage(chatId, { text: 'admin only' }, { quoted: msg }).catch(() => { });
            return;
        }
    }

    // extract quoted text
    let quotedText = null;
    if (quotedMsg) {
        quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || null;
    }

    // execute command
    try {
        await cmd.execute(sock, msg, {
            args, senderId, chatId, isGroup, isOwner,
            quotedMsg, quotedText, mediaMessage, prefix: config.prefix
        });
    } catch (err) {
        console.error(`[${cmdName}]`, err.message);
        sock.sendMessage(chatId, { text: 'error' }, { quoted: msg }).catch(() => { });
    }
}

async function checkAdminCached(sock, groupId, participantId) {
    const key = `${groupId}_${participantId}`;
    const cached = adminCache.get(key);
    if (cached && Date.now() - cached.time < ADMIN_CACHE_TTL) return cached.value;

    try {
        const meta = await sock.groupMetadata(groupId);
        const p = meta.participants.find(p => p.id === participantId || p.id === `${participantId}@s.whatsapp.net`);
        const isAdmin = p?.admin === 'admin' || p?.admin === 'superadmin';
        adminCache.set(key, { value: isAdmin, time: Date.now() });
        return isAdmin;
    } catch {
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
