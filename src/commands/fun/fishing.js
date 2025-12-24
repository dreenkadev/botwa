// fishing - game mancing
const { getBalance, addCoins, removeCoins, formatCoins } = require('../../utils/economy');
const activeFishing = new Map();

module.exports = {
    name: 'fishing',
    aliases: ['fish', 'mancing'],
    description: 'game mancing',

    async execute(sock, msg, { chatId, senderId }) {
        try {
            const lastFish = activeFishing.get(senderId);
            if (lastFish && Date.now() - lastFish < 30000) {
                const remaining = Math.ceil((30000 - (Date.now() - lastFish)) / 1000);
                await sock.sendMessage(chatId, { text: `tunggu ${remaining}s lagi` }, { quoted: msg });
                return;
            }

            activeFishing.set(senderId, Date.now());

            const fish = [
                { name: 'ikan kecil', coins: 10, chance: 30 },
                { name: 'ikan hias', coins: 25, chance: 25 },
                { name: 'ikan buntal', coins: 50, chance: 15 },
                { name: 'hiu kecil', coins: 100, chance: 10 },
                { name: 'gurita', coins: 150, chance: 8 },
                { name: 'lobster', coins: 200, chance: 5 },
                { name: 'paus', coins: 500, chance: 4 },
                { name: 'sepatu bekas', coins: -20, chance: 2 },
                { name: 'harta karun', coins: 1000, chance: 1 }
            ];

            const random = Math.random() * 100;
            let cumulative = 0, caught = fish[0];
            for (const f of fish) { cumulative += f.chance; if (random <= cumulative) { caught = f; break; } }

            if (Math.random() < 0.2) {
                await sock.sendMessage(chatId, { text: '*mancing*\n\ntidak dapat apa-apa' }, { quoted: msg });
                return;
            }

            if (caught.coins > 0) addCoins(senderId, caught.coins);
            else removeCoins(senderId, Math.abs(caught.coins));

            const newBal = getBalance(senderId);
            const coinText = caught.coins > 0 ? '+' + caught.coins : caught.coins;

            await sock.sendMessage(chatId, { text: `*mancing*\n\ndapat: ${caught.name}\n${coinText} coins\nsaldo: ${formatCoins(newBal.coins)}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
