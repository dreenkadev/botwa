// analytics - Group analytics
const { getGroupSummary, getMostActive, getPeakHours, getDailyStats } = require('../../utils/analytics');

module.exports = {
    name: 'analytics',
    aliases: ['stats', 'grupstats', 'groupstats'],
    description: 'statistik grup',
    groupOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const mode = args[0]?.toLowerCase() || 'summary';

            // Summary
            if (mode === 'summary' || !args[0]) {
                const summary = getGroupSummary(chatId);

                let text = `group analytics\n\n`;
                text += `total pesan: ${summary.totalMessages}\n`;
                text += `hari ini: ${summary.todayMessages}\n`;
                text += `minggu ini: ${summary.weekMessages}\n`;
                text += `peak hour: ${summary.peakHour !== null ? summary.peakHour + ':00' : '-'}\n`;

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // Most active users
            if (mode === 'active' || mode === 'mostactive') {
                const active = getMostActive(chatId, 10);

                if (active.length === 0) {
                    await sock.sendMessage(chatId, { text: 'belum ada data' }, { quoted: msg });
                    return;
                }

                let text = `most active members\n\n`;
                active.forEach((u, i) => {
                    const userId = u.userId.split('@')[0];
                    text += `${i + 1}. ${userId.substring(0, 12)}... - ${u.count} pesan\n`;
                });

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // Peak hours
            if (mode === 'peak' || mode === 'hours') {
                const peaks = getPeakHours(chatId).slice(0, 5);

                if (peaks.length === 0) {
                    await sock.sendMessage(chatId, { text: 'belum ada data' }, { quoted: msg });
                    return;
                }

                let text = `peak hours\n\n`;
                peaks.forEach((p, i) => {
                    text += `${i + 1}. ${p.hour}:00 - ${p.count} pesan\n`;
                });

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // Daily stats
            if (mode === 'daily' || mode === 'week') {
                const daily = getDailyStats(chatId, 7);

                let text = `daily stats (7 hari)\n\n`;
                daily.forEach(d => {
                    const bar = '█'.repeat(Math.min(Math.floor(d.count / 10), 20));
                    text += `${d.date.substring(5)}: ${bar} ${d.count}\n`;
                });

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                text: 'analytics\n\n.analytics - summary\n.analytics active - most active\n.analytics peak - peak hours\n.analytics daily - 7 hari terakhir'
            }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error: ' + err.message }, { quoted: msg });
        }
    }
};
