const config = require('../../config');
const { handleCommand } = require('./commandHandler');
const { checkSpam } = require('../utils/antiSpam');
const { isBlacklisted, incrementCommandCount } = require('../utils/database');
const { getMode } = require('../core/state');
const { getGroupSettings } = require('../utils/groupSettings');
const { handleToxicFilter } = require('../services/moderationService');
const { updateOwnerActivity, handleOwnerAutoReply } = require('../core/autoReply');
const { getAfk, removeAfk, formatAfkDuration } = require('../utils/afk');
const { isRentalActive, formatExpiryMessage, getRentalInfo } = require('../utils/rental');

// cache untuk group metadata - mengurangi API calls
const groupMetaCache = new Map();
const CACHE_TTL = 60000; // 1 menit

// Cache untuk rental warning (tidak spam pesan)
const rentalWarningCache = new Map();
const RENTAL_WARNING_INTERVAL = 6 * 60 * 60 * 1000; // 6 jam sekali

function getCachedGroupMeta(chatId) {
    const cached = groupMetaCache.get(chatId);
    if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;
    return null;
}

function setCachedGroupMeta(chatId, data) {
    groupMetaCache.set(chatId, { data, time: Date.now() });
}

async function handleMessage(sock, msg) {
    // quick checks first - no async
    if (!msg.message) return;
    if (msg.key.remoteJid === 'status@broadcast') return;

    const chatId = msg.key.remoteJid;
    const isGroup = chatId.endsWith('@g.us');
    const isFromMe = msg.key.fromMe;

    // Determine sender correctly
    // - In group: participant is the sender
    // - In private + fromMe: sender is the bot/owner
    // - In private + not fromMe: sender is chatId
    let sender;
    if (isGroup) {
        sender = msg.key.participant;
    } else if (isFromMe) {
        // fromMe means the message is from the bot account (which is owner)
        sender = config.ownerNumber + '@s.whatsapp.net';
    } else {
        sender = chatId;
    }

    const senderId = sender?.replace('@s.whatsapp.net', '') || '';
    const isOwner = senderId === config.ownerNumber;

    // Skip fromMe messages except for owner
    if (isFromMe && !isOwner) return;

    // mode check - no async
    if (getMode() === 'self' && !isOwner) return;
    if (isBlacklisted(senderId)) return;

    // extract content - no async
    const messageContent = extractMessageContent(msg);
    if (!messageContent) return;

    const text = messageContent.text || '';
    const quotedMsg = messageContent.quotedMessage;
    const mediaMessage = messageContent.mediaMessage;

    // update owner activity - sync
    if (isOwner) updateOwnerActivity();

    // RENTAL CHECK (skip for owner and allowed commands)
    const allowedRentalCmds = ['sewa', 'masa', 'rent', 'price', 'harga', 'expire', 'remaining'];
    const cmdName = text.startsWith(config.prefix) ? text.slice(config.prefix.length).split(/\s+/)[0]?.toLowerCase() : '';
    const isAllowedCmd = allowedRentalCmds.includes(cmdName);

    if (!isOwner && !isAllowedCmd && config.rentalMode) {
        const rentalActive = isRentalActive(chatId);

        if (!rentalActive) {
            // Check if we should send warning (rate limit)
            const lastWarning = rentalWarningCache.get(chatId) || 0;
            if (Date.now() - lastWarning > RENTAL_WARNING_INTERVAL) {
                rentalWarningCache.set(chatId, Date.now());
                const expiryMsg = formatExpiryMessage(0, true);
                sock.sendMessage(chatId, { text: expiryMsg }).catch(() => { });
            }
            return; // Block command
        }

        // Check if near expiry (warning)
        const info = getRentalInfo(chatId);
        if (info && info.daysRemaining <= 3) {
            const lastWarning = rentalWarningCache.get(chatId + '_warn') || 0;
            if (Date.now() - lastWarning > RENTAL_WARNING_INTERVAL) {
                rentalWarningCache.set(chatId + '_warn', Date.now());
                const warnMsg = formatExpiryMessage(info.daysRemaining, false);
                sock.sendMessage(chatId, { text: warnMsg }).catch(() => { });
            }
        }
    }

    // PRIORITY: handle command FIRST - fastest response
    if (text.startsWith(config.prefix)) {
        const spamCheck = checkSpam(senderId);
        if (spamCheck.blocked) {
            sock.sendMessage(chatId, { text: spamCheck.message }, { quoted: msg }).catch(() => { });
            return;
        }

        incrementCommandCount(senderId);

        // langsung execute command - tidak tunggu fitur lain
        handleCommand(sock, msg, {
            text, senderId, chatId, isGroup, isOwner, quotedMsg, mediaMessage
        }).catch(err => {
            if (!err.message?.includes('rate')) console.log('Cmd Error:', err.message);
        });
        return;
    }

    // background tasks (non-blocking) - jalankan parallel, tidak tunggu
    setImmediate(async () => {
        try {
            // AFK check - sender kembali
            const senderAfk = getAfk(senderId);
            if (senderAfk) {
                const duration = formatAfkDuration(senderAfk.since);
                removeAfk(senderId);
                sock.sendMessage(chatId, {
                    text: `@${senderId} kembali dari afk (${duration})`,
                    mentions: [`${senderId}@s.whatsapp.net`]
                }).catch(() => { });
            }

            // AFK mention check
            if (isGroup && text) {
                const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                for (const jid of mentions) {
                    const afk = getAfk(jid.replace('@s.whatsapp.net', ''));
                    if (afk) {
                        sock.sendMessage(chatId, {
                            text: `@${jid.split('@')[0]} sedang afk: ${afk.reason}`,
                            mentions: [jid]
                        }, { quoted: msg }).catch(() => { });
                    }
                }
            }

            // Owner auto reply
            if (!isGroup && !isOwner) {
                handleOwnerAutoReply(sock, chatId, `${senderId}@s.whatsapp.net`).catch(() => { });
            }

            // Group moderation (toxic, antilink)
            if (isGroup && !isOwner && text) {
                const settings = getGroupSettings(chatId);
                if (settings.toxicFilter) {
                    handleToxicFilter(sock, msg, chatId, `${senderId}@s.whatsapp.net`, text).catch(() => { });
                }
                if (settings.antilink && containsLink(text)) {
                    const isAdmin = await checkAdminCached(sock, chatId, senderId);
                    if (!isAdmin) {
                        sock.sendMessage(chatId, { delete: msg.key }).catch(() => { });
                        sock.sendMessage(chatId, {
                            text: `@${senderId} link tidak diizinkan`,
                            mentions: [`${senderId}@s.whatsapp.net`]
                        }).catch(() => { });
                    }
                }
            }
        } catch { }
    });
}

async function handleGroupUpdate(sock, update) {
    const { id, participants, action } = update;
    if (action !== 'add') return;

    const settings = getGroupSettings(id);
    if (!settings.welcome) return;

    try {
        for (const participant of participants) {
            sock.sendMessage(id, {
                text: `welcome @${participant.split('@')[0]}`,
                mentions: [participant]
            }).catch(() => { });
        }
    } catch { }
}

function extractMessageContent(msg) {
    const m = msg.message;
    let text = '', quotedMessage = null, mediaMessage = null;

    if (m.conversation) {
        text = m.conversation;
    } else if (m.extendedTextMessage) {
        text = m.extendedTextMessage.text || '';
        quotedMessage = m.extendedTextMessage.contextInfo?.quotedMessage;
    } else if (m.imageMessage) {
        text = m.imageMessage.caption || '';
        mediaMessage = { type: 'image', message: m.imageMessage };
    } else if (m.videoMessage) {
        text = m.videoMessage.caption || '';
        mediaMessage = { type: 'video', message: m.videoMessage };
    } else if (m.audioMessage) {
        mediaMessage = { type: 'audio', message: m.audioMessage };
    } else if (m.documentMessage) {
        text = m.documentMessage.caption || '';
        mediaMessage = { type: 'document', message: m.documentMessage };
    } else if (m.stickerMessage) {
        mediaMessage = { type: 'sticker', message: m.stickerMessage };
    }

    return { text, quotedMessage, mediaMessage };
}

function containsLink(text) {
    return /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|id|co|me))/i.test(text);
}

async function checkAdminCached(sock, groupId, participantId) {
    try {
        let meta = getCachedGroupMeta(groupId);
        if (!meta) {
            meta = await sock.groupMetadata(groupId);
            setCachedGroupMeta(groupId, meta);
        }
        const p = meta.participants.find(p => p.id === participantId || p.id === `${participantId}@s.whatsapp.net`);
        return p?.admin === 'admin' || p?.admin === 'superadmin';
    } catch { return false; }
}

module.exports = { handleMessage, handleGroupUpdate };
