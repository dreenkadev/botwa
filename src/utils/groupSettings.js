const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '..', 'database', 'group_settings.json');

function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (err) { }
    return {};
}

function saveSettings(settings) {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function getGroupSettings(groupId) {
    const settings = loadSettings();
    if (!settings[groupId]) {
        settings[groupId] = {
            welcome: false,
            antispam: false,
            antilink: false,
            antiviewonce: false,
            toxicFilter: false
        };
        saveSettings(settings);
    }
    return settings[groupId];
}

function updateGroupSettings(groupId, updates) {
    const settings = loadSettings();
    if (!settings[groupId]) {
        settings[groupId] = { welcome: false, antispam: false, antilink: false, antiviewonce: false, toxicFilter: false };
    }
    if (typeof updates === 'object') {
        settings[groupId] = { ...settings[groupId], ...updates };
    }
    saveSettings(settings);
}

module.exports = { getGroupSettings, updateGroupSettings };
