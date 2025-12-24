module.exports = {
    name: 'rumus',
    aliases: ['formula', 'math-formula'],
    description: 'Collection of math/physics formulas',

    async execute(sock, msg, { chatId, args }) {
        const category = args[0]?.toLowerCase();

        const formulas = {
            'lingkaran': {
                title: 'Rumus Lingkaran',
                content: `🔴 *Lingkaran*\n\nKeliling = 2πr = πd\nLuas = πr²\n\nDimana:\nπ = 3.14159...\nr = jari-jari\nd = diameter`
            },
            'segitiga': {
                title: 'Rumus Segitiga',
                content: `🔺 *Segitiga*\n\nLuas = ½ × alas × tinggi\nKeliling = a + b + c\n\nPythagoras:\nc² = a² + b²`
            },
            'persegi': {
                title: 'Rumus Persegi',
                content: `⬜ *Persegi*\n\nLuas = s²\nKeliling = 4s\nDiagonal = s√2\n\nDimana:\ns = sisi`
            },
            'kubus': {
                title: 'Rumus Kubus',
                content: `📦 *Kubus*\n\nVolume = s³\nLuas permukaan = 6s²\nDiagonal ruang = s√3\n\nDimana:\ns = sisi`
            },
            'tabung': {
                title: 'Rumus Tabung',
                content: `🥫 *Tabung*\n\nVolume = πr²t\nLuas selimut = 2πrt\nLuas permukaan = 2πr(r + t)\n\nDimana:\nr = jari-jari\nt = tinggi`
            },
            'bola': {
                title: 'Rumus Bola',
                content: `🌍 *Bola*\n\nVolume = (4/3)πr³\nLuas permukaan = 4πr²\n\nDimana:\nr = jari-jari`
            },
            'fisika': {
                title: 'Rumus Fisika Dasar',
                content: `⚡ *Fisika Dasar*\n\nKecepatan: v = s/t\nPercepatan: a = Δv/Δt\nGaya: F = m × a\nUsaha: W = F × s\nDaya: P = W/t\n\nGerak Jatuh Bebas:\nh = ½gt²\nv = gt`
            },
            'glbb': {
                title: 'Rumus GLBB',
                content: `🚗 *GLBB*\n\nvₜ = v₀ + at\ns = v₀t + ½at²\nvₜ² = v₀² + 2as\ns = ((v₀ + vₜ)/2) × t`
            },
            'listrik': {
                title: 'Rumus Listrik',
                content: `⚡ *Listrik*\n\nHukum Ohm: V = IR\nDaya: P = VI = I²R = V²/R\nEnergi: W = Pt\n\nRangkaian:\nSeri: Rₜ = R₁ + R₂ + ...\nParalel: 1/Rₜ = 1/R₁ + 1/R₂ + ...`
            }
        };

        if (!category || !formulas[category]) {
            const categories = Object.keys(formulas).join(', ');
            await sock.sendMessage(chatId, {
                text: `📐 *Rumus Matematika & Fisika*\n\nUsage: .rumus <kategori>\n\nKategori:\n${categories}\n\nContoh: .rumus lingkaran\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
            }, { quoted: msg });
            return;
        }

        const formula = formulas[category];
        await sock.sendMessage(chatId, {
            text: `📐 *${formula.title}*\n\n${formula.content}\n\n𝗗𝗿𝗲𝗲𝗻𝗸𝗮𝗗𝗲𝘃`
        }, { quoted: msg });
    }
};
