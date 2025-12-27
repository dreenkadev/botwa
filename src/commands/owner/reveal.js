// reveal - Manual reveal viewonce by replying to it
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'reveal',
    aliases: ['openvo', 'viewonce', 'vo'],
    description: 'buka viewonce dengan reply',
    ownerOnly: true,

    async execute(sock, msg, { chatId, quotedMsg }) {
        try {
            // Must reply to a message
            if (!quotedMsg) {
                await sock.sendMessage(chatId, {
                    text: 'reply ke pesan viewonce untuk membukanya'
                }, { quoted: msg });
                return;
            }

            // Check if quoted message is viewonce
            let mediaType = null;
            let isViewOnce = false;
            let originalCaption = '';

            // Check all viewonce formats
            if (quotedMsg.viewOnceMessage?.message) {
                isViewOnce = true;
                if (quotedMsg.viewOnceMessage.message.imageMessage) {
                    mediaType = 'image';
                    originalCaption = quotedMsg.viewOnceMessage.message.imageMessage.caption || '';
                }
                if (quotedMsg.viewOnceMessage.message.videoMessage) {
                    mediaType = 'video';
                    originalCaption = quotedMsg.viewOnceMessage.message.videoMessage.caption || '';
                }
            }
            
            if (quotedMsg.viewOnceMessageV2?.message) {
                isViewOnce = true;
                if (quotedMsg.viewOnceMessageV2.message.imageMessage) {
                    mediaType = 'image';
                    originalCaption = quotedMsg.viewOnceMessageV2.message.imageMessage.caption || '';
                }
                if (quotedMsg.viewOnceMessageV2.message.videoMessage) {
                    mediaType = 'video';
                    originalCaption = quotedMsg.viewOnceMessageV2.message.videoMessage.caption || '';
                }
            }
            
            if (quotedMsg.viewOnceMessageV2Extension?.message) {
                isViewOnce = true;
                if (quotedMsg.viewOnceMessageV2Extension.message.imageMessage) {
                    mediaType = 'image';
                    originalCaption = quotedMsg.viewOnceMessageV2Extension.message.imageMessage.caption || '';
                }
                if (quotedMsg.viewOnceMessageV2Extension.message.videoMessage) {
                    mediaType = 'video';
                    originalCaption = quotedMsg.viewOnceMessageV2Extension.message.videoMessage.caption || '';
                }
            }

            // Check viewOnce flag on regular media
            if (quotedMsg.imageMessage?.viewOnce) {
                isViewOnce = true;
                mediaType = 'image';
                originalCaption = quotedMsg.imageMessage.caption || '';
            }
            if (quotedMsg.videoMessage?.viewOnce) {
                isViewOnce = true;
                mediaType = 'video';
                originalCaption = quotedMsg.videoMessage.caption || '';
            }

            if (!isViewOnce || !mediaType) {
                await sock.sendMessage(chatId, {
                    text: 'pesan yang di-reply bukan viewonce'
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(chatId, {
                text: 'downloading viewonce...'
            }, { quoted: msg });

            // Create a fake message object for download
            const quotedKey = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

            const fakeMsg = {
                key: {
                    remoteJid: chatId,
                    id: quotedKey,
                    participant: quotedParticipant
                },
                message: quotedMsg
            };

            // Download the media
            let buffer;
            try {
                buffer = await downloadMediaMessage(
                    fakeMsg,
                    'buffer',
                    {},
                    {
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
            } catch (dlErr) {
                console.log('[Reveal] Download error:', dlErr.message);
                await sock.sendMessage(chatId, {
                    text: 'gagal download: ' + dlErr.message
                }, { quoted: msg });
                return;
            }

            if (!buffer || buffer.length === 0) {
                await sock.sendMessage(chatId, {
                    text: 'gagal download viewonce (empty buffer)'
                }, { quoted: msg });
                return;
            }

            // Build caption with original caption if exists
            let caption = `viewonce revealed`;
            if (originalCaption) {
                caption += `\n\ncaption asli:\n${originalCaption}`;
            }

            // Send the media back
            if (mediaType === 'image') {
                await sock.sendMessage(chatId, {
                    image: buffer,
                    caption
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    video: buffer,
                    caption
                }, { quoted: msg });
            }

            console.log(`[Reveal] ViewOnce revealed: ${mediaType}, ${buffer.length} bytes`);

        } catch (err) {
            console.log('[Reveal] Error:', err.message);
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};
