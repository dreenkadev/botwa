// setspecial - Set custom auto-reply for special contact
const { setSpecialContact, removeSpecialContact, getSpecialContacts } = require('../../core/autoReply');

module.exports = {
    name: 'setspecial',
    aliases: ['special', 'sc'],
    description: 'set pesan khusus untuk special contact',
    ownerOnly: true,

    async execute(sock, msg, { chatId, args }) {
        try {
            const action = args[0]?.toLowerCase();

            // Show help
            if (!action) {
                const contacts = getSpecialContacts();
                const contactList = Object.entries(contacts);

                let text = `setpacar - auto-reply khusus\n\n`;
                text += `.setpacar add <nomor> <nama> | <pesan>\n`;
                text += `.setpacar remove <nomor>\n`;
                text += `.setpacar list\n\n`;
                text += `variabel pesan:\n`;
                text += `{name} = nama owner\n`;
                text += `{time} = durasi tidak aktif\n\n`;
                text += `contoh:\n`;
                text += `.setpacar add 628123456789 Sayang | Hai {name} lagi sibuk ya? Udah {time} ga aktif nih 💕`;

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            // Add special contact
            if (action === 'add') {
                // Parse: add <number> <name> | <message>
                const rest = args.slice(1).join(' ');
                const pipeIndex = rest.indexOf('|');

                if (pipeIndex === -1) {
                    await sock.sendMessage(chatId, {
                        text: 'format: .setpacar add <nomor> <nama> | <pesan>'
                    }, { quoted: msg });
                    return;
                }

                const beforePipe = rest.substring(0, pipeIndex).trim();
                const message = rest.substring(pipeIndex + 1).trim();

                const parts = beforePipe.split(/\s+/);
                const number = parts[0].replace(/[^0-9]/g, '');
                const name = parts.slice(1).join(' ') || 'Special';

                if (!number || number.length < 10) {
                    await sock.sendMessage(chatId, {
                        text: 'nomor tidak valid'
                    }, { quoted: msg });
                    return;
                }

                if (!message) {
                    await sock.sendMessage(chatId, {
                        text: 'pesan tidak boleh kosong'
                    }, { quoted: msg });
                    return;
                }

                setSpecialContact(number, name, message);

                await sock.sendMessage(chatId, {
                    text: `special contact ditambahkan\n\nnomor: ${number}\nnama: ${name}\npesan: ${message}`
                }, { quoted: msg });
                return;
            }

            // Remove special contact
            if (action === 'remove' || action === 'delete') {
                const number = args[1]?.replace(/[^0-9]/g, '');

                if (!number) {
                    await sock.sendMessage(chatId, {
                        text: 'masukkan nomor yang mau dihapus'
                    }, { quoted: msg });
                    return;
                }

                removeSpecialContact(number);

                await sock.sendMessage(chatId, {
                    text: `nomor ${number} dihapus dari special contact`
                }, { quoted: msg });
                return;
            }

            // List special contacts
            if (action === 'list') {
                const contacts = getSpecialContacts();
                const entries = Object.entries(contacts);

                if (entries.length === 0) {
                    await sock.sendMessage(chatId, {
                        text: 'belum ada special contact'
                    }, { quoted: msg });
                    return;
                }

                let text = `special contacts (${entries.length}):\n\n`;
                entries.forEach(([num, data], i) => {
                    text += `${i + 1}. ${data.name}\n`;
                    text += `   ${num}\n`;
                    text += `   "${data.customMessage.substring(0, 50)}..."\n\n`;
                });

                await sock.sendMessage(chatId, { text }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                text: 'action tidak dikenal. ketik .setpacar untuk bantuan'
            }, { quoted: msg });

        } catch (err) {
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};
