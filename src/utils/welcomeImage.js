// Welcome/Goodbye Image Generator
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, 'database', 'welcome_settings.json');
let settings = {};

function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch { settings = {}; }
}

function saveSettings() {
    try {
        const dir = path.dirname(settingsPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch { }
}

function getWelcomeSettings(groupId) {
    loadSettings();
    return settings[groupId] || { enabled: false, message: 'welcome {name} to {group}!' };
}

function setWelcomeSettings(groupId, data) {
    loadSettings();
    settings[groupId] = { ...getWelcomeSettings(groupId), ...data };
    saveSettings();
}

/**
 * Generate welcome/goodbye image
 */
async function generateWelcomeImage(options) {
    const {
        name = 'Member',
        groupName = 'Group',
        memberCount = 0,
        profilePicUrl = null,
        type = 'welcome' // welcome or goodbye
    } = options;

    const width = 800;
    const height = 400;
    const isWelcome = type === 'welcome';

    // Background gradient colors
    const bgColor = isWelcome ? { r: 30, g: 60, b: 114 } : { r: 80, g: 30, b: 30 };
    const bgColor2 = isWelcome ? { r: 42, g: 82, b: 152 } : { r: 120, g: 40, b: 40 };

    // Create gradient background
    const background = await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: bgColor
        }
    }).png().toBuffer();

    // Create profile picture circle or placeholder
    let profileBuffer;
    try {
        if (profilePicUrl) {
            const response = await axios.get(profilePicUrl, {
                responseType: 'arraybuffer',
                timeout: 5000
            });
            profileBuffer = await sharp(Buffer.from(response.data))
                .resize(150, 150)
                .composite([{
                    input: Buffer.from(`<svg><circle cx="75" cy="75" r="75" fill="white"/></svg>`),
                    blend: 'dest-in'
                }])
                .png()
                .toBuffer();
        }
    } catch { }

    // Fallback profile placeholder
    if (!profileBuffer) {
        profileBuffer = await sharp({
            create: {
                width: 150,
                height: 150,
                channels: 4,
                background: { r: 100, g: 100, b: 100, alpha: 1 }
            }
        })
            .composite([{
                input: Buffer.from(`<svg width="150" height="150">
                <circle cx="75" cy="75" r="75" fill="#555"/>
                <text x="75" y="90" font-size="60" fill="white" text-anchor="middle" font-family="Arial">${name.charAt(0).toUpperCase()}</text>
            </svg>`),
                top: 0,
                left: 0
            }])
            .png()
            .toBuffer();
    }

    // Create text overlay
    const title = isWelcome ? 'WELCOME' : 'GOODBYE';
    const subtitle = isWelcome ? `member #${memberCount}` : 'see you again!';

    const textSvg = `
        <svg width="${width}" height="${height}">
            <style>
                .title { fill: white; font-size: 48px; font-weight: bold; font-family: Arial, sans-serif; }
                .name { fill: #FFD700; font-size: 36px; font-weight: bold; font-family: Arial, sans-serif; }
                .group { fill: #ddd; font-size: 24px; font-family: Arial, sans-serif; }
                .subtitle { fill: #aaa; font-size: 18px; font-family: Arial, sans-serif; }
            </style>
            <text x="400" y="100" text-anchor="middle" class="title">${title}</text>
            <text x="400" y="280" text-anchor="middle" class="name">${escapeXml(name.substring(0, 25))}</text>
            <text x="400" y="320" text-anchor="middle" class="group">${escapeXml(groupName.substring(0, 40))}</text>
            <text x="400" y="360" text-anchor="middle" class="subtitle">${subtitle}</text>
        </svg>
    `;

    // Composite all elements
    const finalImage = await sharp(background)
        .composite([
            {
                input: profileBuffer,
                top: 120,
                left: Math.floor((width - 150) / 2)
            },
            {
                input: Buffer.from(textSvg),
                top: 0,
                left: 0
            }
        ])
        .jpeg({ quality: 90 })
        .toBuffer();

    return finalImage;
}

function escapeXml(str) {
    return str.replace(/[<>&'"]/g, c => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
    }[c]));
}

module.exports = {
    generateWelcomeImage,
    getWelcomeSettings,
    setWelcomeSettings
};
