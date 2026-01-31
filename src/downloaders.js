const { spawn } = require('child_process');
const path = require('path');

const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

// Windowsda .exe, Linuxda (Render) tizimdagi buyruq
const YTDLP_EXE = isRender ? 'yt-dlp' : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
const FFMPEG_PATH = isRender ? '/usr/bin' : path.join(__dirname, '..', 'bin');

function getMediaStream(url, type = 'video') {
    let formatArgs = [];
    
    if (type === 'audio') {
        formatArgs = ['--format', 'bestaudio/best'];
    } else {
        // H.264 formati (Telegram uchun)
        formatArgs = [
            '--format', 'bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best',
            '--merge-output-format', 'mp4'
        ];
    }

    const args = [
        '--ffmpeg-location', FFMPEG_PATH,
        ...formatArgs,
        
        // --- ANTI-BLOK VA ALDASH KODLARI ---
        // Serverni oddiy brauzer qilib ko'rsatamiz
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        '--referer', 'https://www.google.com/',
        '--add-header', 'Accept-Language:en-US,en;q=0.9',
        '--add-header', 'Sec-Fetch-Mode:navigate',
        
        // Geo-bloklarni aylanib o'tishga harakat qilish
        '--geo-bypass',
        
        // Qo'shimcha sozlamalar
        '--no-playlist',
        '--no-check-certificate',
        '--quiet',         
        '--no-warnings',   
        '-o', '-',         
        url
    ];

    // WindowsHide: true (Qora oynani yo'qotish)
    const ytProcess = spawn(YTDLP_EXE, args, { windowsHide: true });

    ytProcess.stderr.on('data', (data) => {
        const msg = data.toString();
        // Faqat jiddiy xatolarni chiqaramiz, ogohlantirishlarni emas
        if (msg.includes('ERROR') || msg.includes('Error')) {
            console.error("YT-DLP Xatosi:", msg);
        }
    });

    return ytProcess.stdout;
}

module.exports = { getMediaStream };