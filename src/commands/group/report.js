// report - report user ke admin
module.exports = {
    name: 'report',
    aliases: ['lapor'],
    description: 'report user ke admin',
    groupOnly: true,

    async execute(sock, msg, { chatId, args, senderId, quotedMsg }) {
        try {
            let targetId = null;
            let reason = args.join(' ');

            if (quotedMsg) {
                targetId = msg.message?.extendedTextMessage?.contextInfo?.participant?.replace('@s.whatsapp.net', '');
            } else {
                const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                if (mentions.length > 0) {
                    targetId = mentions[0].replace('@s.whatsapp.net', '');
                    reason = args.slice(1).join(' ');
                }
            }

            if (!targetId) {
                await sock.sendMessage(chatId, { text: '*report*\n\n.report @user <alasan>' }, { quoted: msg });
                return;
            }

            if (!reason) reason = 'tidak ada alasan';

            const groupMeta = await sock.groupMetadata(chatId);
            const admins = groupMeta.participants.filter(p => p.admin);

            await sock.sendMessage(chatId, {
                text: `*report*\n\ndilaporkan: @${targetId}\nalasan: ${reason}\npelapor: @${senderId}\n\nadmin akan meninjau`,
                mentions: [`${targetId}@s.whatsapp.net`, `${senderId}@s.whatsapp.net`]
            }, { quoted: msg });

            for (const admin of admins) {
                try { await sock.sendMessage(admin.id, { text: `report dari ${groupMeta.subject}\n\nuser: @${targetId}\nalasan: ${reason}\npelapor: @${senderId}`, mentions: [`${targetId}@s.whatsapp.net`, `${senderId}@s.whatsapp.net`] }); } catch { }
            }
        } catch (err) {
            await sock.sendMessage(chatId, { text: 'gagal report' }, { quoted: msg });
        }
    }
};
