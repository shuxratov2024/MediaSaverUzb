const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
const YTDLP_EXE = isRender ? 'yt-dlp' : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
const FFMPEG_PATH = isRender ? '/usr/bin' : path.join(__dirname, '..', 'bin');

// --- 1. YANGI API SERVERLAR (Hozir aktivlari) ---
const COBALT_INSTANCES = [
    'https://cobalt.arme.ws',      // Juda barqaror
    'https://cobalt.xyzen.dev',    // Tez
    'https://api.wwebs.net',       // Zaxira
];

// --- 2. ASOSIY FUNKSIYA (GIBRID) ---
async function getMediaLink(url) {
    console.log(`[Boshlandi] Link: ${url}`);

    // 1-USUL: API orqali urinib ko'ramiz (Tezkor)
    for (const server of COBALT_INSTANCES) {
        try {
            // console.log(`API tekshirilmoqda: ${server}`);
            const response = await axios.post(server, {
                url: url,
                videoQuality: '720',
                filenameStyle: 'basic',
                disableMetadata: true
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36'
                },
                timeout: 4000 // 4 soniya kutamiz
            });

            if (response.data && response.data.url) {
                console.log(`✅ API topdi: ${server}`);
                return { type: 'url', data: response.data.url };
            }
            if (response.data && response.data.picker) {
                console.log(`✅ API topdi (Picker): ${server}`);
                return { type: 'url', data: response.data.picker[0].url };
            }

        } catch (error) {
            continue; // Keyingi serverga o'tamiz
        }
    }

    // 2-USUL: Agar hamma APIlar o'lsa, YT-DLP ishlatamiz (Zaxira)
    console.log("⚠️ APIlar ishlamadi, yt-dlp ga o'tilmoqda...");
    return { type: 'stream', data: getLocalStream(url) };
}

// YT-DLP Funksiyasi (Zaxira va YouTube uchun)
function getLocalStream(url, type = 'video') {
    let formatArgs = type === 'audio' 
        ? ['--format', 'bestaudio/best']
        : ['--format', 'bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best', '--merge-output-format', 'mp4'];

    const args = [
        '--ffmpeg-location', FFMPEG_PATH,
        ...formatArgs,
        // Anti-blok headerlar
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        '--no-playlist', '--no-check-certificate', '--quiet', '--no-warnings',
        '-o', '-',
        url
    ];

    return spawn(YTDLP_EXE, args, { windowsHide: true }).stdout;
}

module.exports = { getMediaLink, getLocalStream };