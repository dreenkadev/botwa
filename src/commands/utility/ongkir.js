const axios = require('axios');

module.exports = {
    name: 'ongkir',
    aliases: ['cekongkir', 'shipping'],
    description: 'Check shipping cost',

    async execute(sock, msg, { chatId, args }) {
        if (args.length < 3) {
            await sock.sendMessage(chatId, {
                text: `📦 *Cek Ongkos Kirim*\n\nUsage: .ongkir <asal> <tujuan> <berat(gram)>\n\nContoh: .ongkir jakarta bandung 1000\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
            return;
        }

        const origin = args[0].toLowerCase();
        const destination = args[1].toLowerCase();
        const weight = parseInt(args[2]) || 1000;

        await sock.sendMessage(chatId, { text: '📦 Menghitung ongkir...\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃' }, { quoted: msg });

        try {
            // Using example rates (in real app, integrate with RajaOngkir API)
            const baseRates = {
                'jne': { reg: 9000, yes: 18000, oke: 7000 },
                'jnt': { reg: 8000, exp: 15000 },
                'sicepat': { reg: 9000, best: 15000 },
                'anteraja': { reg: 8500, next: 16000 }
            };

            // Calculate based on weight (per kg)
            const weightKg = Math.ceil(weight / 1000);

            let text = `📦 *Estimasi Ongkir*\n\n`;
            text += `📤 Dari: ${origin.charAt(0).toUpperCase() + origin.slice(1)}\n`;
            text += `📥 Ke: ${destination.charAt(0).toUpperCase() + destination.slice(1)}\n`;
            text += `⚖️ Berat: ${weight}g (${weightKg}kg)\n\n`;
            text += `📋 *Estimasi Harga:*\n\n`;

            for (const [courier, services] of Object.entries(baseRates)) {
                text += `🏢 *${courier.toUpperCase()}*\n`;
                for (const [service, price] of Object.entries(services)) {
                    const total = price * weightKg;
                    text += `   • ${service.toUpperCase()}: Rp ${total.toLocaleString('id-ID')}\n`;
                }
                text += '\n';
            }

            text += `⚠️ *Catatan:* Harga estimasi, bisa berbeda dengan harga aktual.\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`;

            await sock.sendMessage(chatId, { text }, { quoted: msg });

        } catch {
            await sock.sendMessage(chatId, {
                text: 'Gagal menghitung ongkir\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃'
            }, { quoted: msg });
        }
    }
};
