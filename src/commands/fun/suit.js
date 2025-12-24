// suit - batu gunting kertas
module.exports = {
    name: 'suit',
    aliases: ['rps', 'janken'],
    description: 'batu gunting kertas',

    async execute(sock, msg, { chatId, args }) {
        try {
            const choices = ['batu', 'gunting', 'kertas'];
            const aliases = { 'b': 'batu', 'g': 'gunting', 'k': 'kertas', 'rock': 'batu', 'paper': 'kertas', 'scissors': 'gunting' };

            let userChoice = args[0]?.toLowerCase();
            userChoice = aliases[userChoice] || userChoice;

            if (!userChoice || !choices.includes(userChoice)) {
                await sock.sendMessage(chatId, { text: '*suit*\n\n.suit <batu/gunting/kertas>\natau .suit b/g/k' }, { quoted: msg });
                return;
            }

            const botChoice = choices[Math.floor(Math.random() * 3)];
            let result;

            if (userChoice === botChoice) {
                result = 'seri';
            } else if (
                (userChoice === 'batu' && botChoice === 'gunting') ||
                (userChoice === 'gunting' && botChoice === 'kertas') ||
                (userChoice === 'kertas' && botChoice === 'batu')
            ) {
                result = 'kamu menang';
            } else {
                result = 'bot menang';
            }

            await sock.sendMessage(chatId, { text: `*suit*\n\nkamu: ${userChoice}\nbot: ${botChoice}\n\n${result}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
