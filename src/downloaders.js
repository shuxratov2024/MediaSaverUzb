const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// --- 1. YANGILANGAN VA TEKSHIRILGAN SERVERLAR ---
// api.server.social - O'CHIRILDI (Xato bergani uchun)
// Yangi ishonchli serverlar qo'shildi:
const COBALT_INSTANCES = [
    'https://cobalt.kwiatekmiki.pl', // Polsha (Juda barqaror)
    'https://api.succoon.com',       // Germaniya (Tez)
    'https://cobalt.tools',          // Rasmiy server (Zaxira)
];

async function getMediaLink(url) {
    console.log(`Linkni qidiryabman: ${url}`);

    for (const server of COBALT_INSTANCES) {
        try {
            console.log(`Urinib ko'rilmoqda: ${server}`);
            
            const response = await axios.post(server, {
                url: url,
                videoQuality: '720',
                filenameStyle: 'basic',
                disableMetadata: true,
                // SSL xatolarini oldini olish uchun oddiy sozlama
                alwaysProxy: false 
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36'
                },
                timeout: 8000 // 8 soniya kutamiz (server uzoqda bo'lsa)
            });

            // Agar URL kelsa
            if (response.data && response.data.url) {
                console.log(`✅ Muvaffaqiyatli: ${server}`);
                return response.data.url;
            } 
            
            // Agar Picker kelsa (masalan TikTok rasmlar)
            if (response.data && response.data.picker) {
                console.log(`✅ Muvaffaqiyatli (Picker): ${server}`);
                return response.data.picker[0].url;
            }

        } catch (error) {
            // Xatoni ko'ramiz va keyingi serverga o'tamiz
            console.log(`❌ ${server} xatosi: ${error.message}. Keyingisi...`);
            continue;
        }
    }
    
    console.error("Hamma serverlar band yoki ishlamayapti.");
    return null;
}

// --- YOUTUBE UCHUN (O'zgarmadi) ---
const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
const YTDLP_EXE = isRender ? 'yt-dlp' : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
const FFMPEG_PATH = isRender ? '/usr/bin' : path.join(__dirname, '..', 'bin');

function getYouTubeStream(url, type = 'video') {
    let formatArgs = type === 'audio' 
        ? ['--format', 'bestaudio/best']
        : ['--format', 'bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best', '--merge-output-format', 'mp4'];

    const args = [
        '--ffmpeg-location', FFMPEG_PATH,
        ...formatArgs,
        '--no-playlist', '--no-check-certificate', '--quiet', '--no-warnings',
        '-o', '-',
        url
    ];
    return spawn(YTDLP_EXE, args, { windowsHide: true }).stdout;
}

module.exports = { getMediaLink, getYouTubeStream };