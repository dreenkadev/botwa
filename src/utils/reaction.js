// reaction helper - untuk processing indicator
async function react(sock, msg, emoji) {
    try {
        await sock.sendMessage(msg.key.remoteJid, {
            react: { text: emoji, key: msg.key }
        });
    } catch { }
}

async function reactProcessing(sock, msg) {
    await react(sock, msg, '⚙️');
}

async function reactDone(sock, msg) {
    await react(sock, msg, '');
}

async function reactSuccess(sock, msg) {
    await react(sock, msg, '✅');
}

async function reactFail(sock, msg) {
    await react(sock, msg, '❌');
}

module.exports = {
    react,
    reactProcessing,
    reactDone,
    reactSuccess,
    reactFail
};
