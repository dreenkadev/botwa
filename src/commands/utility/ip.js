const axios = require('axios');

module.exports = {
    name: 'ip',
    aliases: ['ipinfo', 'iplookup'],
    description: 'Get IP/domain information',

    async execute(sock, msg, { chatId, args }) {
        const target = args[0];

        if (!target) {
            await sock.sendMessage(chatId, {
                text: ' Please provide an IP or domain!\nUsage: .ip <ip or domain>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            const response = await axios.get(`http://ip-api.com/json/${target}`, {
                timeout: 10000
            });

            const data = response.data;

            if (data.status === 'fail') {
                await sock.sendMessage(chatId, {
                    text: ` ${data.message}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
                return;
            }

            const text = ` *IP Information*

 IP: ${data.query}
 Country: ${data.country} (${data.countryCode})
 Region: ${data.regionName}
 City: ${data.city}
 ZIP: ${data.zip || 'N/A'}
 Timezone: ${data.timezone}
 ISP: ${data.isp}
 Org: ${data.org || 'N/A'}
 AS: ${data.as || 'N/A'}
 Lat/Lon: ${data.lat}, ${data.lon}

𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: ' Failed to lookup IP/domain\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};
