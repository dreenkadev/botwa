// ship - love calculator antara 2 user
module.exports = {
    name: 'ship',
    aliases: ['love', 'match'],
    description: 'cek kecocokan 2 user',
    groupOnly: true,

    async execute(sock, msg, { chatId }) {
        try {
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            if (mentions.length < 2) {
                await sock.sendMessage(chatId, { text: '*ship*\n\n.ship @user1 @user2' }, { quoted: msg });
                return;
            }

            const user1 = mentions[0].split('@')[0];
            const user2 = mentions[1].split('@')[0];

            const combined = user1 < user2 ? user1 + user2 : user2 + user1;
            let hash = 0;
            for (let i = 0; i < combined.length; i++) {
                hash = ((hash << 5) - hash) + combined.charCodeAt(i);
                hash = hash & hash;
            }
            const percentage = Math.abs(hash % 101);

            let message;
            if (percentage >= 90) message = 'perfect match!';
            else if (percentage >= 70) message = 'cocok banget';
            else if (percentage >= 50) message = 'lumayan cocok';
            else if (percentage >= 30) message = 'bisa dicoba';
            else message = 'mending temenan aja';

            const bar = '#'.repeat(Math.floor(percentage / 10)) + '-'.repeat(10 - Math.floor(percentage / 10));

            await sock.sendMessage(chatId, {
                text: `*love calculator*\n\n@${user1} x @${user2}\n\n[${bar}] ${percentage}%\n\n${message}`,
                mentions: [mentions[0], mentions[1]]
            }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error' }, { quoted: msg });
        }
    }
};
