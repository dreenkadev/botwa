const axios = require('axios');

module.exports = {
    name: 'github',
    aliases: ['gh', 'git'],
    description: 'Get GitHub user profile info',

    async execute(sock, msg, { chatId, args }) {
        const username = args[0];

        if (!username) {
            await sock.sendMessage(chatId, {
                text: ' Please provide a GitHub username!\nUsage: .github <username>\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
            return;
        }

        try {
            const response = await axios.get(`https://api.github.com/users/${username}`, {
                timeout: 10000,
                headers: { 'User-Agent': 'WhatsAppBot' }
            });

            const data = response.data;

            const text = ` *GitHub Profile*

 *${data.name || username}* (@${data.login})
${data.bio ? ` ${data.bio}\n` : ''}
 Location: ${data.location || 'N/A'}
 Company: ${data.company || 'N/A'}
 Email: ${data.email || 'N/A'}
 Blog: ${data.blog || 'N/A'}

 *Stats:*
• Repos: ${data.public_repos}
• Gists: ${data.public_gists}
• Followers: ${data.followers}
• Following: ${data.following}

 Joined: ${new Date(data.created_at).toLocaleDateString()}

 ${data.html_url}

𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            if (data.avatar_url) {
                try {
                    const imgResponse = await axios.get(data.avatar_url, {
                        responseType: 'arraybuffer',
                        timeout: 10000
                    });
                    await sock.sendMessage(chatId, {
                        image: Buffer.from(imgResponse.data),
                        caption: text
                    }, { quoted: msg });
                    return;
                } catch { }
            }

            await sock.sendMessage(chatId, { text }, { quoted: msg });
        } catch (err) {
            if (err.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: ` User "${username}" not found\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: ' Failed to fetch GitHub profile\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
                }, { quoted: msg });
            }
        }
    }
};
