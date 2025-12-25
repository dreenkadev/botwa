// growagarden - Info stock Grow a Garden game Roblox
const axios = require('axios');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'growagarden',
    aliases: ['gag', 'gardeninfo', 'gaginfo'],
    description: 'Cek stock info game Grow a Garden (Roblox)',

    async execute(sock, msg, { chatId }) {
        try {
            await reactProcessing(sock, msg);

            const data = await getGardenInfo();

            await reactDone(sock, msg);

            if (!data) {
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mengambil data Grow a Garden.'
                }, { quoted: msg });
                return;
            }

            let message = `🌱 *GROW A GARDEN INFO* 🌱\n\n`;
            message += `🔗 *Source:* ${data.source || 'Unknown'}\n`;
            message += `🔄 *Updated:* ${data.updated || 'Unknown'}\n\n`;

            // User info
            if (data.user) {
                message += `👤 *USER INFO*\n`;
                message += `• Player: ${data.user.playerName || 'Unknown'}\n`;
                message += `• User ID: ${data.user.userId || 'Unknown'}\n\n`;
            }

            // Garden info
            if (data.garden) {
                message += `🏡 *GARDEN INFO*\n`;
                if (data.garden.weather) {
                    message += `• Weather: ${data.garden.weather.type} (${data.garden.weather.duration}s)\n`;
                }
                message += `\n`;

                // Seeds available
                const seeds = (data.garden.seeds || []).filter(s => s.quantity > 0);
                if (seeds.length > 0) {
                    message += `🌿 *SEEDS (${seeds.length})*\n`;
                    seeds.slice(0, 5).forEach(s => {
                        message += `• ${s.name}: ${s.quantity}\n`;
                    });
                    if (seeds.length > 5) message += `• ... dan ${seeds.length - 5} lainnya\n`;
                    message += `\n`;
                }

                // Gear available
                const gear = (data.garden.gear || []).filter(g => g.quantity > 0);
                if (gear.length > 0) {
                    message += `🛠️ *GEAR (${gear.length})*\n`;
                    gear.slice(0, 5).forEach(g => {
                        message += `• ${g.name}: ${g.quantity}\n`;
                    });
                    if (gear.length > 5) message += `• ... dan ${gear.length - 5} lainnya\n`;
                    message += `\n`;
                }

                // Eggs available
                const eggs = (data.garden.eggs || []).filter(e => e.quantity > 0);
                if (eggs.length > 0) {
                    message += `🥚 *EGGS (${eggs.length})*\n`;
                    eggs.slice(0, 5).forEach(e => {
                        message += `• ${e.name}: ${e.quantity}\n`;
                    });
                    if (eggs.length > 5) message += `• ... dan ${eggs.length - 5} lainnya\n`;
                }
            }

            await sock.sendMessage(chatId, {
                text: message.trim()
            }, { quoted: msg });

        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: '❌ Error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function getGardenInfo() {
    try {
        const response = await axios.get('https://api.zenzxz.my.id/api/info/growagardenstock', {
            timeout: 15000
        });

        if (response.data?.data) {
            return response.data.data;
        }

        return null;
    } catch (err) {
        console.log('Grow a Garden error:', err.message);
        return null;
    }
}
