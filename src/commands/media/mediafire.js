// mediafire - Download files from MediaFire
const axios = require('axios');
const cheerio = require('cheerio');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'mediafire',
    aliases: ['mf'],
    description: 'download file dari mediafire',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];

            if (!url || !url.includes('mediafire.com')) {
                await sock.sendMessage(chatId, {
                    text: 'mediafire\n\n.mediafire <url>\n\ncontoh:\n.mediafire https://mediafire.com/file/xxx'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const fileInfo = await getMediafireInfo(url);

            if (!fileInfo?.downloadUrl) {
                await reactDone(sock, msg);
                await sock.sendMessage(chatId, {
                    text: 'gagal mendapatkan link download'
                }, { quoted: msg });
                return;
            }

            await reactDone(sock, msg);

            const info = `mediafire file\n\nfile: ${fileInfo.fileName}\nsize: ${fileInfo.fileSize}\nlink: ${fileInfo.downloadUrl}`;

            await sock.sendMessage(chatId, { text: info }, { quoted: msg });

            // Auto download if small
            const sizeNum = parseFloat(fileInfo.fileSize);
            const isSmall = fileInfo.fileSize.includes('KB') ||
                (fileInfo.fileSize.includes('MB') && sizeNum < 100);

            if (isSmall) {
                try {
                    const fileRes = await axios.get(fileInfo.downloadUrl, {
                        responseType: 'arraybuffer',
                        timeout: 120000,
                        maxContentLength: 100 * 1024 * 1024
                    });

                    await sock.sendMessage(chatId, {
                        document: Buffer.from(fileRes.data),
                        fileName: fileInfo.fileName,
                        mimetype: fileInfo.mimeType || 'application/octet-stream'
                    }, { quoted: msg });
                } catch { }
            }
        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: 'error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function getMediafireInfo(url) {
    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const $ = cheerio.load(response.data);
        const downloadBtn = $('#downloadButton');
        const downloadUrl = downloadBtn.attr('href');

        let fileName = downloadUrl?.split('/').pop() || '';
        fileName = decodeURIComponent(fileName);

        if (!fileName) {
            fileName = $('.dl-btn-label').attr('title') || $('.filename').text().trim() || 'file';
        }

        const fileSize = $('li.details').find('span:contains("File size")').parent().text()
            .replace('File size', '').trim() || 'Unknown';

        const extension = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            'pdf': 'application/pdf',
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4',
            'apk': 'application/vnd.android.package-archive'
        };

        return {
            fileName,
            fileSize,
            mimeType: mimeTypes[extension] || 'application/octet-stream',
            downloadUrl
        };
    } catch (err) {
        return null;
    }
}
