// calc - kalkulator
module.exports = {
    name: 'calc',
    aliases: ['hitung', 'math'],
    description: 'kalkulator',

    async execute(sock, msg, { chatId, args }) {
        try {
            const expression = args.join(' ');

            if (!expression) {
                await sock.sendMessage(chatId, { text: '*calc*\n\n.calc <ekspresi>\ncontoh: .calc 2+2*3' }, { quoted: msg });
                return;
            }

            const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
            if (!sanitized) {
                await sock.sendMessage(chatId, { text: 'ekspresi tidak valid' }, { quoted: msg });
                return;
            }

            const result = Function('"use strict"; return (' + sanitized + ')')();

            if (typeof result !== 'number' || !isFinite(result)) {
                await sock.sendMessage(chatId, { text: 'hasil tidak valid' }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, { text: `*calc*\n\n${sanitized} = ${result}` }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
