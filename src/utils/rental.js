// Rental System - Bot rental/sewa management
const fs = require('fs');
const path = require('path');
const config = require('../../config');

const rentalPath = path.join(__dirname, '..', 'database', 'rental.json');

let rentalData = {
    chats: {},  // chatId -> { expiry, addedBy, addedAt }
    settings: {
        ownerPhone: config.ownerNumber || '',
        paymentInfo: {
            bank: '---',
            accountNumber: '---',
            accountName: 'DreenkaDev',
            ewallet: {
                dana: '085768943436',
                gopay: '085768943436',
                ovo: '085768943436'
            }
        },
        priceList: [
            { days: 7, price: 5000, label: '1 Minggu' },
            { days: 30, price: 20000, label: '1 Bulan' },
            { days: 90, price: 50000, label: '3 Bulan' },
            { days: 180, price: 80000, label: '6 Bulan' },
            { days: 365, price: 120000, label: '1 Tahun' }
        ],
        warningDays: [7, 3, 1] // Warn at 7, 3, 1 days before expiry
    }
};

function loadRental() {
    try {
        if (fs.existsSync(rentalPath)) {
            const data = JSON.parse(fs.readFileSync(rentalPath, 'utf8'));
            rentalData = { ...rentalData, ...data };
        }
    } catch { }
}

function saveRental() {
    try {
        const dir = path.dirname(rentalPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(rentalPath, JSON.stringify(rentalData, null, 2));
    } catch { }
}

/**
 * Check if chat is allowed to use bot
 * @param {string} chatId 
 * @returns {boolean}
 */
function isRentalActive(chatId) {
    loadRental();

    // Owner always allowed
    if (chatId.includes(config.ownerNumber)) return true;

    const rental = rentalData.chats[chatId];
    if (!rental) return false;

    return rental.expiry > Date.now();
}

/**
 * Get rental info for a chat
 */
function getRentalInfo(chatId) {
    loadRental();
    const rental = rentalData.chats[chatId];

    if (!rental) return null;

    const now = Date.now();
    const remaining = rental.expiry - now;
    const isActive = remaining > 0;
    const daysRemaining = Math.ceil(remaining / (24 * 60 * 60 * 1000));

    return {
        ...rental,
        isActive,
        remaining,
        daysRemaining,
        expiryDate: new Date(rental.expiry).toLocaleString('id-ID')
    };
}

/**
 * Add or extend rental
 */
function addRental(chatId, days, addedBy) {
    loadRental();

    const now = Date.now();
    const daysMs = days * 24 * 60 * 60 * 1000;

    const existing = rentalData.chats[chatId];
    let newExpiry;

    if (existing && existing.expiry > now) {
        // Extend existing
        newExpiry = existing.expiry + daysMs;
    } else {
        // New rental
        newExpiry = now + daysMs;
    }

    rentalData.chats[chatId] = {
        expiry: newExpiry,
        addedBy,
        addedAt: now,
        days: existing ? (existing.days || 0) + days : days
    };

    saveRental();
    return getRentalInfo(chatId);
}

/**
 * Remove rental
 */
function removeRental(chatId) {
    loadRental();
    delete rentalData.chats[chatId];
    saveRental();
}

/**
 * Get all active rentals
 */
function getAllRentals() {
    loadRental();
    const now = Date.now();

    return Object.entries(rentalData.chats)
        .map(([chatId, data]) => ({
            chatId,
            ...data,
            daysRemaining: Math.ceil((data.expiry - now) / (24 * 60 * 60 * 1000)),
            isActive: data.expiry > now
        }))
        .sort((a, b) => a.expiry - b.expiry);
}

/**
 * Get chats that need expiry warning
 */
function getExpiringChats() {
    loadRental();
    const now = Date.now();
    const warnings = [];

    for (const [chatId, data] of Object.entries(rentalData.chats)) {
        const daysRemaining = Math.ceil((data.expiry - now) / (24 * 60 * 60 * 1000));

        if (daysRemaining <= 0) {
            warnings.push({ chatId, daysRemaining: 0, type: 'expired' });
        } else if (rentalData.settings.warningDays.includes(daysRemaining)) {
            warnings.push({ chatId, daysRemaining, type: 'warning' });
        }
    }

    return warnings;
}

/**
 * Get price list
 */
function getPriceList() {
    loadRental();
    return rentalData.settings.priceList;
}

/**
 * Get payment info
 */
function getPaymentInfo() {
    loadRental();
    return rentalData.settings.paymentInfo;
}

/**
 * Update settings (owner only)
 */
function updateSettings(settings) {
    loadRental();
    rentalData.settings = { ...rentalData.settings, ...settings };
    saveRental();
}

/**
 * Format expiry message
 */
function formatExpiryMessage(daysRemaining, isExpired = false) {
    const payment = getPaymentInfo();
    const prices = getPriceList();

    let msg = '';

    if (isExpired) {
        msg = `⚠️ MASA SEWA HABIS ⚠️\n\nbot tidak aktif di chat ini.\nperpanjang sewa untuk melanjutkan.\n\n`;
    } else {
        msg = `⚠️ SEWA AKAN BERAKHIR ⚠️\n\nsisa waktu: ${daysRemaining} hari lagi\nperpanjang sekarang agar tidak terputus.\n\n`;
    }

    msg += `Price:\n`;
    prices.forEach(p => {
        msg += `• ${p.label}: Rp ${p.price.toLocaleString('id-ID')}\n`;
    });

    msg += `\nPayment:\n`;
    msg += `Bank ${payment.bank}: ${payment.accountNumber}\na.n ${payment.accountName}\n\n`;
    msg += `E-Wallet:\n`;
    if (payment.ewallet.dana) msg += `• DANA: ${payment.ewallet.dana}\n`;
    if (payment.ewallet.gopay) msg += `• GoPay: ${payment.ewallet.gopay}\n`;
    if (payment.ewallet.ovo) msg += `• OVO: ${payment.ewallet.ovo}\n`;

    msg += `\nhubungi owner: wa.me/${config.ownerNumber}\n\n${config.signature}`;

    return msg;
}

// Initialize
loadRental();

module.exports = {
    isRentalActive,
    getRentalInfo,
    addRental,
    removeRental,
    getAllRentals,
    getExpiringChats,
    getPriceList,
    getPaymentInfo,
    updateSettings,
    formatExpiryMessage,
    loadRental,
    saveRental
};
