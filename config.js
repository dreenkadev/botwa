module.exports = {
    prefix: '.',
    ownerNumber: '6285768943436',
    ownerName: 'Dreenka',
    botName: 'DreenkaBot-WA',
    botDescription: 'WhatsApp Bot',
    signature: '𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃',

    mode: 'private',

    cooldown: {
        duration: 5000,
        maxWarnings: 3,
        blockDuration: 60000
    },

    // AI Configuration
    groqApiKey: process.env.GROQ_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || ''
};
