const { spawn } = require('child_process');
const path = require('path');

// Render (Linux) uchun yt-dlp va ffmpeg manzillarini aniqlaymiz
// Agarda loyiha Renderda bo'lsa, tizimdagi global yt-dlp dan foydalanadi
const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

const YTDLP_EXE = isRender ? 'yt-dlp' : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
const FFMPEG_PATH = isRender ? '/usr/bin' : path.join(__dirname, '..', 'bin');

function getMediaStream(url, type = 'video') {
    const args = [
        '--ffmpeg-location', FFMPEG_PATH,
        '--format', type === 'audio' ? 'bestaudio/best' : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--no-playlist',
        '--no-check-certificate',
        '-o', '-', 
        url
    ];

    const ytProcess = spawn(YTDLP_EXE, args);

    ytProcess.stderr.on('data', (data) => {
        console.log("YT-DLP DEBUG:", data.toString());
    });

    return ytProcess.stdout;
}

module.exports = { getMediaStream };