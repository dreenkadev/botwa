// clearsession - Clear corrupted session for specific user
const mongoose = require('mongoose');

module.exports = {
    name: 'clearsession',
    aliases: ['fixsession', 'resetuser'],
    description: 'clear corrupted session for user',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const userId = args[0];

            if (!userId) {
                await sock.sendMessage(chatId, {
                    text: 'clearsession\n\n.clearsession <user_id>\n.clearsession all - clear semua session\n\ngunakan jika ada "Bad MAC Error"'
                }, { quoted: msg });
                return;
            }

            // Check MongoDB connection
            if (mongoose.connection.readyState !== 1) {
                await sock.sendMessage(chatId, { text: 'mongodb tidak terkoneksi' }, { quoted: msg });
                return;
            }

            const AuthModel = mongoose.models.Auth || mongoose.model('Auth', new mongoose.Schema({
                _id: String,
                data: mongoose.Schema.Types.Mixed
            }));

            if (userId === 'all') {
                // Clear all session-* entries (keep creds)
                const result = await AuthModel.deleteMany({ _id: { $regex: /^session-/ } });
                await sock.sendMessage(chatId, {
                    text: `cleared ${result.deletedCount} session entries\n\nrestart bot untuk refresh`
                }, { quoted: msg });
                return;
            }

            // Clear specific user session
            const sessionKey = `session-${userId}`;
            const result = await AuthModel.deleteOne({ _id: sessionKey });

            if (result.deletedCount > 0) {
                await sock.sendMessage(chatId, {
                    text: `session ${userId} dihapus\n\nrestart bot untuk refresh`
                }, { quoted: msg });
            } else {
                // Try with @lid suffix
                const lidKey = `session-${userId}@lid`;
                const lidResult = await AuthModel.deleteOne({ _id: lidKey });

                if (lidResult.deletedCount > 0) {
                    await sock.sendMessage(chatId, {
                        text: `session ${userId}@lid dihapus\n\nrestart bot untuk refresh`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, { text: 'session tidak ditemukan' }, { quoted: msg });
                }
            }

        } catch (err) {
            await sock.sendMessage(chatId, { text: 'error: ' + err.message }, { quoted: msg });
        }
    }
};
