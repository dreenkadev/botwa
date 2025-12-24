const config = require('../../config');

function checkSpam(userId) {
    return { blocked: false };
}

function resetCooldown(userId) { }

module.exports = { checkSpam, resetCooldown };
