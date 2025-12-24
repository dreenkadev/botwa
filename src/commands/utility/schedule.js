const { addScheduledMessage, getScheduledMessages, removeScheduledMessage } = require('../../utils/groupManager');

// Store pending scheduled messages to execute later
const pendingSchedules = new Map();

module.exports = {
    name: 'schedule',
    aliases: ['jadwal', 'sched'],
    description: 'Schedule a message to be sent later',
    adminOnly: true,

    async execute(sock, msg, { chatId, args, senderId }) {
        const action = args[0]?.toLowerCase();

        if (!action || action === 'list') {
            const schedules = getScheduledMessages(chatId);

            if (schedules.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `📅 *Scheduled Messages*\n\nTidak ada pesan terjadwal.\n\nUsage:\n.schedule <waktu> <pesan>\n.schedule list\n.schedule del <id>\n\nFormat waktu: 5m, 1h, 2h30m\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
                return;
            }

            let text = `📅 *Scheduled Messages* (${schedules.length})\n\n`;
            schedules.forEach(s => {
                const time = new Date(s.executeAt).toLocaleString('id-ID');
                text += `🆔 ${s.id}\n`;
                text += `⏰ ${time}\n`;
                text += `📝 ${s.message.substring(0, 50)}...\n\n`;
            });
            text += '𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃';

            await sock.sendMessage(chatId, { text }, { quoted: msg });
            return;
        }

        if (action === 'del' || action === 'delete') {
            const schedId = args[1];
            if (!schedId) {
                await sock.sendMessage(chatId, {
                    text: '❌ Masukkan ID schedule!\n\n.schedule del <id>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
                return;
            }

            const removed = removeScheduledMessage(schedId);
            if (pendingSchedules.has(schedId)) {
                clearTimeout(pendingSchedules.get(schedId));
                pendingSchedules.delete(schedId);
            }

            await sock.sendMessage(chatId, {
                text: removed ? '✅ Schedule dihapus!\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃' : '❌ Schedule tidak ditemukan.\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        // Parse time and message
        const timeStr = args[0];
        const message = args.slice(1).join(' ');

        if (!message) {
            await sock.sendMessage(chatId, {
                text: '📅 *Schedule Message*\n\nUsage: .schedule <waktu> <pesan>\n\nContoh:\n.schedule 5m Jangan lupa meeting!\n.schedule 1h Waktunya istirahat\n.schedule 2h30m Deadline!\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        // Parse time string
        let ms = 0;
        const hourMatch = timeStr.match(/(\d+)h/);
        const minMatch = timeStr.match(/(\d+)m/);
        const secMatch = timeStr.match(/(\d+)s/);

        if (hourMatch) ms += parseInt(hourMatch[1]) * 3600000;
        if (minMatch) ms += parseInt(minMatch[1]) * 60000;
        if (secMatch) ms += parseInt(secMatch[1]) * 1000;

        if (ms < 60000) {
            await sock.sendMessage(chatId, {
                text: '❌ Minimum waktu: 1 menit\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        if (ms > 86400000 * 7) {
            await sock.sendMessage(chatId, {
                text: '❌ Maximum waktu: 7 hari\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        const executeAt = Date.now() + ms;
        const schedId = addScheduledMessage(chatId, message, executeAt, senderId);

        // Set timeout
        const timeout = setTimeout(async () => {
            try {
                await sock.sendMessage(chatId, {
                    text: `📅 *Scheduled Message*\n\n${message}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                });
                removeScheduledMessage(schedId);
                pendingSchedules.delete(schedId);
            } catch { }
        }, ms);

        pendingSchedules.set(schedId, timeout);

        const execTime = new Date(executeAt).toLocaleString('id-ID');
        await sock.sendMessage(chatId, {
            text: `✅ *Message Scheduled!*\n\n🆔 ${schedId}\n⏰ Akan dikirim: ${execTime}\n📝 ${message}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
        }, { quoted: msg });
    }
};
