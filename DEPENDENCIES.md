# DreenkaBot-WA Dependencies

## npm packages (package.json)
semua sudah ada, jalankan: npm install

## system requirements
install manual di linux:

# yt-dlp - media downloader
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# ffmpeg - audio/video processing
sudo apt install ffmpeg

## fitur per dependency

### npm packages
| package | fitur |
|---------|-------|
| @whiskeysockets/baileys | core whatsapp |
| axios | http requests api |
| dotenv | environment variables |
| form-data | upload files |
| pino | logging |
| qrcode-terminal | qr code login |
| sharp | image processing |

### system tools
| tool | fitur |
|------|-------|
| yt-dlp | tt, ig, yt, spotify, twitter, fb, pinterest |
| ffmpeg | bass, slow, nightcore, audio effects |

## note
- tidak ada python dependencies
- yt-dlp adalah binary standalone
