// slot machine game dengan economy system
const { getBalance, addCoins, removeCoins, formatCoins } = require('../../utils/economy');

module.exports = {
    name: 'slot',
    aliases: ['slots', 'spin'],
    description: 'main slot machine',

    async execute(sock, msg, { chatId, args, senderId }) {
        try {
            const bet = parseInt(args[0]) || 100;

            if (bet < 10) {
                await sock.sendMessage(chatId, { text: 'minimal bet 10 coins' }, { quoted: msg });
                return;
            }

            if (bet > 10000) {
                await sock.sendMessage(chatId, { text: 'maksimal bet 10000 coins' }, { quoted: msg });
                return;
            }

            const user = getBalance(senderId);
            if (user.coins < bet) {
                await sock.sendMessage(chatId, {
                    text: `saldo tidak cukup\nsaldo: ${formatCoins(user.coins)}`
                }, { quoted: msg });
                return;
            }

            const symbols = ['7', 'A', 'K', 'Q', 'J', '*'];
            const spin = () => symbols[Math.floor(Math.random() * symbols.length)];
            const result = [spin(), spin(), spin()];
            const display = `[ ${result[0]} | ${result[1]} | ${result[2]} ]`;

            let winMultiplier = 0;
            let message = '';

            if (result[0] === result[1] && result[1] === result[2]) {
                winMultiplier = result[0] === '7' ? 50 : result[0] === '*' ? 20 : 5;
                message = 'jackpot!';
            } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
                winMultiplier = 2;
                message = 'double';
            } else {
                message = 'tidak beruntung';
            }

            removeCoins(senderId, bet);
            let prize = 0;
            if (winMultiplier > 0) {
                prize = bet * winMultiplier;
                addCoins(senderId, prize);
            }

            const newBalance = getBalance(senderId);
            const profitLoss = prize - bet;
            const plText = profitLoss >= 0 ? '+' + formatCoins(profitLoss) : formatCoins(profitLoss);

            await sock.sendMessage(chatId, {
                text: `*slot*\n\n${display}\n\n${message}\nbet: ${formatCoins(bet)}\n${winMultiplier > 0 ? 'win: ' + formatCoins(prize) + ' (' + winMultiplier + 'x)\n' : ''}hasil: ${plText}\nsaldo: ${formatCoins(newBalance.coins)}`
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error: ' + (err.message || 'unknown') }, { quoted: msg });
        }
    }
};
