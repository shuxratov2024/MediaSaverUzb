const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios'); // Yangi qo'shildi

const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
const YTDLP_EXE = isRender ? 'yt-dlp' : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
const FFMPEG_PATH = isRender ? '/usr/bin' : path.join(__dirname, '..', 'bin');

// 1. YouTube uchun (yt-dlp ishlatamiz)
function getYouTubeStream(url, type = 'video') {
    let formatArgs = [];
    if (type === 'audio') {
        formatArgs = ['--format', 'bestaudio/best'];
    } else {
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
        '--quiet', '--no-warnings',
        '-o', '-',
        url
    ];

    return spawn(YTDLP_EXE, args, { windowsHide: true }).stdout;
}

// 2. Instagram va TikTok uchun (API ishlatamiz)
async function getSocialMediaLink(url) {
    try {
        // Cobalt API - bepul va kuchli
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vCodec: 'h264', // Telegram uchun mos format
            vQuality: '720',
            filenamePattern: 'basic',
            isAudioOnly: false
        }, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (response.data && response.data.url) {
            return response.data.url; // Tayyor video link qaytadi
        } else {
            throw new Error("API video topolmadi");
        }
    } catch (error) {
        console.error("API Error:", error.message);
        return null;
    }
}

module.exports = { getYouTubeStream, getSocialMediaLink };