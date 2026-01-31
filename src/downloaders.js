const { spawn } = require('child_process');
const path = require('path');

const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

// Windowsda .exe, Linuxda (Render) tizimdagi buyruq
const YTDLP_EXE = isRender ? 'yt-dlp' : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
const FFMPEG_PATH = isRender ? '/usr/bin' : path.join(__dirname, '..', 'bin');

function getMediaStream(url, type = 'video') {
    // Format tanlovi (Tezlik va sifat balansi)
    let formatArgs = [];
    
    if (type === 'audio') {
        formatArgs = ['--format', 'bestaudio/best'];
    } else {
        // H.264 (MP4) - Telegram uchun eng ishonchli va tez format
        formatArgs = [
            '--format', 'bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best',
            '--merge-output-format', 'mp4'
        ];
    }

    const args = [
        '--ffmpeg-location', FFMPEG_PATH,
        ...formatArgs,
        '--no-playlist',
        '--no-check-certificate',
        '--quiet',         // Ortiqcha ma'lumot chiqarmaslik (tezlatadi)
        '--no-warnings',   // Ogohlantirishlarni ko'rsatmaslik
        '-o', '-',         // Stream rejimi
        url
    ];

    // Qora oyna chiqmasligi uchun 'windowsHide: true' qo'shildi
    const ytProcess = spawn(YTDLP_EXE, args, { windowsHide: true });

    ytProcess.stderr.on('data', (data) => {
        // Faqat jiddiy xatolarni logga chiqaramiz
        const msg = data.toString();
        if (msg.includes('ERROR')) console.error("YT-DLP Error:", msg);
    });

    return ytProcess.stdout;
}

module.exports = { getMediaStream };