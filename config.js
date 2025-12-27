module.exports = {
    prefix: '.',
    ownerNumber: '6285768943436',
    ownerLid: '24932570402997', // WhatsApp Linked ID
    ownerName: 'Dreenka',
    botName: 'DreenkaBot-WA',
    botDescription: 'WhatsApp Bot',
    signature: '𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃',

    mode: 'private',

    // Rental Mode - set true for rental bot (bot only works for paying users)
    rentalMode: false,

    cooldown: {
        duration: 5000,
        maxWarnings: 3,
        blockDuration: 60000
    },

    // AI Configuration
    groqApiKey: process.env.GROQ_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || ''
};
