const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BIN_PATH = path.join(PROJECT_ROOT, 'bin');
const YTDLP_EXE = path.join(BIN_PATH, 'yt-dlp.exe');

function getMediaStream(url, type = 'video') {
    const args = [
        '--ffmpeg-location', BIN_PATH,
        '--format', type === 'audio' ? 'bestaudio/best' : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--no-playlist',
        '--no-check-certificate',
        '-o', '-', // Ma'lumotni diskka emas, oqimga (stdout) chiqarish
        url
    ];

    const ytProcess = spawn(YTDLP_EXE, args);

    ytProcess.stderr.on('data', (data) => {
        // Xatolarni terminalda kuzatish uchun (muhim)
        console.log("YT-DLP DEBUG:", data.toString());
    });

    return ytProcess.stdout;
}

module.exports = { getMediaStream };