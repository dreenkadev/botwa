// warn - beri warning ke member
const warnings = new Map();

module.exports = {
    name: 'warn',
    aliases: ['warning'],
    description: 'beri warning ke member',
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, { chatId, args, quotedMsg }) {
        try {
            const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            let targetId = mentions[0];

            if (!targetId && quotedMsg) {
                targetId = msg.message?.extendedTextMessage?.contextInfo?.participant;
            }

            if (!targetId) {
                await sock.sendMessage(chatId, { text: '*warn*\n\n.warn @user [alasan]' }, { quoted: msg });
                return;
            }

            const reason = args.slice(1).join(' ') || 'tidak ada alasan';
            const key = `${chatId}_${targetId}`;
            const current = warnings.get(key) || 0;
            const newCount = current + 1;
            warnings.set(key, newCount);

            let text = `warning ${newCount}/3\nuser: @${targetId.split('@')[0]}\nalasan: ${reason}`;

            if (newCount >= 3) {
                try {
                    await sock.groupParticipantsUpdate(chatId, [targetId], 'remove');
                    text += '\n\n3x warning, user dikick';
                    warnings.delete(key);
                } catch { }
            }

            await sock.sendMessage(chatId, { text, mentions: [targetId] }, { quoted: msg });
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal warn member' }, { quoted: msg });
        }
    }
};
