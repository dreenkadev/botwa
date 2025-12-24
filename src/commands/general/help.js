const config = require('../../../config');

module.exports = {
  name: 'help',
  aliases: ['h', 'guide'],
  description: 'Show bot usage guide',

  async execute(sock, msg, { chatId }) {
    const helpText = ` *Bot Guide*

*How to Use:*
Send a message starting with "${config.prefix}" followed by a command.

*Examples:*
${config.prefix}ping - Check if bot is alive
${config.prefix}menu - View all commands
${config.prefix}ai Hello! - Chat with AI

*Group Commands:*
${config.prefix}kick @user - Remove a user
${config.prefix}tagall - Tag all members
${config.prefix}poll - Create a poll

*Media Commands:*
${config.prefix}sticker - Convert image to sticker
${config.prefix}blur - Blur an image
${config.prefix}qr - Generate QR code

*Tips:*
• Don't spam commands
• Wait for cooldown between commands
• Some commands are admin/owner only

Use ${config.prefix}menu for full command list.

𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

    await sock.sendMessage(chatId, { text: helpText }, { quoted: msg });
  }
};
