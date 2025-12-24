module.exports = {
    name: 'time',
    aliases: ['worldclock', 'timezone', 'jam'],
    description: 'Get current time in different timezones',

    async execute(sock, msg, { chatId, args }) {
        const timezones = {
            'jakarta': { tz: 'Asia/Jakarta', name: 'Jakarta (WIB)' },
            'wib': { tz: 'Asia/Jakarta', name: 'WIB (Jakarta)' },
            'makassar': { tz: 'Asia/Makassar', name: 'Makassar (WITA)' },
            'wita': { tz: 'Asia/Makassar', name: 'WITA (Makassar)' },
            'jayapura': { tz: 'Asia/Jayapura', name: 'Jayapura (WIT)' },
            'wit': { tz: 'Asia/Jayapura', name: 'WIT (Jayapura)' },
            'tokyo': { tz: 'Asia/Tokyo', name: 'Tokyo' },
            'seoul': { tz: 'Asia/Seoul', name: 'Seoul' },
            'singapore': { tz: 'Asia/Singapore', name: 'Singapore' },
            'kuala lumpur': { tz: 'Asia/Kuala_Lumpur', name: 'Kuala Lumpur' },
            'bangkok': { tz: 'Asia/Bangkok', name: 'Bangkok' },
            'dubai': { tz: 'Asia/Dubai', name: 'Dubai' },
            'london': { tz: 'Europe/London', name: 'London' },
            'paris': { tz: 'Europe/Paris', name: 'Paris' },
            'berlin': { tz: 'Europe/Berlin', name: 'Berlin' },
            'moscow': { tz: 'Europe/Moscow', name: 'Moscow' },
            'new york': { tz: 'America/New_York', name: 'New York' },
            'los angeles': { tz: 'America/Los_Angeles', name: 'Los Angeles' },
            'sydney': { tz: 'Australia/Sydney', name: 'Sydney' },
            'utc': { tz: 'UTC', name: 'UTC' }
        };

        if (args.length === 0) {
            // Show popular timezones
            const now = new Date();
            let text = ' *World Clock*\n\n';

            const showTimezones = ['wib', 'wita', 'wit', 'tokyo', 'singapore', 'london', 'new york'];

            for (const key of showTimezones) {
                const zone = timezones[key];
                const time = now.toLocaleString('en-US', {
                    timeZone: zone.tz,
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                text += ` ${zone.name}: ${time}\n`;
            }

            text += '\n.time <city> for specific timezone\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃';

            await sock.sendMessage(chatId, { text }, { quoted: msg });
            return;
        }

        const query = args.join(' ').toLowerCase();
        const zone = timezones[query];

        if (!zone) {
            const available = Object.keys(timezones).join(', ');
            await sock.sendMessage(chatId, {
                text: ` Unknown timezone: ${query}\n\nAvailable: ${available}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
            return;
        }

        const now = new Date();
        const time = now.toLocaleString('en-US', {
            timeZone: zone.tz,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        await sock.sendMessage(chatId, {
            text: ` *${zone.name}*\n\n${time}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
        }, { quoted: msg });
    }
};
