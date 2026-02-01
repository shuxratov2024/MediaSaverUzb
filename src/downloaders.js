const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// --- 1. TEZ IShLAYDIGAN API SERVERLAR RO'YXATI ---
// Agar bittasi ishlamasa, bot keyingisiga o'tadi.
const COBALT_INSTANCES = [
    'https://cobalt.kwiatekmiki.pl', // Polsha serveri (Juda tez)
    'https://api.succoon.com',       // Zaxira 1
    'https://cobalt.tools.api.red',  // Zaxira 2
    'https://api.server.social',     // Zaxira 3
];

// --- 2. API ORQALI YUKLASH (Instagram, TikTok) ---
async function getMediaLink(url) {
    // Har bir serverni navbatma-navbat tekshirib ko'ramiz
    for (const server of COBALT_INSTANCES) {
        try {
            console.log(`Urinib ko'rilmoqda: ${server}`);
            
            const response = await axios.post(server, {
                url: url,
                // Yangi Cobalt v10 sozlamalari:
                videoQuality: '720',
                filenameStyle: 'basic',
                disableMetadata: true
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
                },
                timeout: 5000 // 5 soniya kutamiz, javob bo'lmasa keyingisiga o'tamiz
            });

            // Agar server javob bersa va link bo'lsa
            if (response.data && response.data.url) {
                return response.data.url;
            } else if (response.data.picker) {
                return response.data.picker[0].url;
            }

        } catch (error) {
            // Bu server ishlamadi, hech qisi yo'q, keyingisiga o'tamiz
            console.log(`${server} dan xato: ${error.message}`);
            continue; 
        }
    }
    
    // Agar hamma serverlar o'chgan bo'lsa:
    console.error("Hamma API serverlar band yoki ishlamayapti.");
    return null;
}

// --- 3. YOUTUBE UChUN (Eski ishonchli usul) ---
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