// mediafire - Download files from MediaFire
const axios = require('axios');
const cheerio = require('cheerio');
const { reactProcessing, reactDone } = require('../../utils/reaction');

module.exports = {
    name: 'mediafire',
    aliases: ['mf'],
    description: 'Download file from MediaFire link',

    async execute(sock, msg, { chatId, args }) {
        try {
            const url = args[0];

            if (!url || !url.includes('mediafire.com')) {
                await sock.sendMessage(chatId, {
                    text: '*📦 MEDIAFIRE DOWNLOADER*\n\nUsage: .mediafire <url>\n\nExample:\n.mediafire https://www.mediafire.com/file/xxx'
                }, { quoted: msg });
                return;
            }

            await reactProcessing(sock, msg);

            const fileInfo = await getMediafireInfo(url);

            if (!fileInfo || !fileInfo.downloadUrl) {
                await reactDone(sock, msg);
                await sock.sendMessage(chatId, {
                    text: '❌ Gagal mendapatkan link download. Pastikan URL valid.'
                }, { quoted: msg });
                return;
            }

            await reactDone(sock, msg);

            // Send file info
            const info = `*📦 MEDIAFIRE FILE*\n\n` +
                `📄 *File:* ${fileInfo.fileName}\n` +
                `📊 *Size:* ${fileInfo.fileSize}\n` +
                `📅 *Uploaded:* ${fileInfo.uploadDate}\n` +
                `📎 *Type:* ${fileInfo.mimeType || 'Unknown'}\n\n` +
                `🔗 *Download:* ${fileInfo.downloadUrl}`;

            await sock.sendMessage(chatId, {
                text: info
            }, { quoted: msg });

            // Try to download if file is small enough (< 100MB)
            const sizeNum = parseFloat(fileInfo.fileSize);
            const isSmall = fileInfo.fileSize.includes('KB') ||
                (fileInfo.fileSize.includes('MB') && sizeNum < 100);

            if (isSmall) {
                try {
                    const fileRes = await axios.get(fileInfo.downloadUrl, {
                        responseType: 'arraybuffer',
                        timeout: 120000,
                        maxContentLength: 100 * 1024 * 1024 // 100MB limit
                    });

                    await sock.sendMessage(chatId, {
                        document: Buffer.from(fileRes.data),
                        fileName: fileInfo.fileName,
                        mimetype: fileInfo.mimeType || 'application/octet-stream'
                    }, { quoted: msg });
                } catch {
                    // If download fails, user can use the link
                }
            }

        } catch (err) {
            await reactDone(sock, msg);
            await sock.sendMessage(chatId, {
                text: '❌ Error: ' + err.message
            }, { quoted: msg });
        }
    }
};

async function getMediafireInfo(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // Extract file information
        const downloadBtn = $('#downloadButton');
        const downloadUrl = downloadBtn.attr('href');

        // Get file name from download URL or page
        let fileName = downloadUrl?.split('/').pop() || '';
        fileName = decodeURIComponent(fileName);

        // Alternative: get from page title
        if (!fileName) {
            fileName = $('.dl-btn-label').attr('title') ||
                $('.filename').text().trim() ||
                'unknown_file';
        }

        // Get file size
        const fileSize = $('li.details').find('span:contains("File size")').parent().text()
            .replace('File size', '').trim() ||
            $('a#downloadButton').attr('data-qahref')?.match(/[\d.]+\s*[KMGT]?B/i)?.[0] ||
            $('.details li').first().find('span').text().trim() ||
            'Unknown';

        // Get upload date
        const uploadDate = $('li.details').find('span:contains("Uploaded")').parent().text()
            .replace('Uploaded', '').trim() ||
            $('.details li').eq(1).find('span').text().trim() ||
            'Unknown';

        // Get mime type from extension
        const extension = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed',
            '7z': 'application/x-7z-compressed',
            'pdf': 'application/pdf',
            'mp3': 'audio/mpeg',
            'mp4': 'video/mp4',
            'apk': 'application/vnd.android.package-archive',
            'exe': 'application/x-msdownload',
            'jpg': 'image/jpeg',
            'png': 'image/png'
        };
        const mimeType = mimeTypes[extension] || 'application/octet-stream';

        return {
            fileName,
            fileSize,
            uploadDate,
            mimeType,
            downloadUrl
        };
    } catch (err) {
        console.log('MediaFire error:', err.message);
        return null;
    }
}
