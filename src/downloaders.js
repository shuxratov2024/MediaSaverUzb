const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

// --- 1. ISHLAYDIGAN SERVERLAR RO'YXATI (v10) ---
// Biz eski "api.cobalt.tools" ni RO'YXATDAN O'CHIRDIK.
// Endi faqat tirik serverlarni ishlatamiz.
const COBALT_INSTANCES = [
    'https://cobalt.kwiatekmiki.pl', // 1-urinish
    'https://api.succoon.com',       // 2-urinish
    'https://api.server.social',     // 3-urinish
    'https://w.manowar.dev'          // 4-urinish
];

async function getMediaLink(url) {
    console.log(`Linkni qidiryabman: ${url}`);

    for (const server of COBALT_INSTANCES) {
        try {
            // Serverga so'rov yuborish
            const response = await axios.post(server, {
                url: url,
                // Yangi Cobalt v10 sozlamalari
                videoQuality: '720',
                filenameStyle: 'basic',
                disableMetadata: true,
                alwaysProxy: false 
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/123.0.0.0 Safari/537.36'
                },
                timeout: 6000 // 6 soniya kutamiz
            });

            // Agar javob kelsa va unda URL bo'lsa
            if (response.data && response.data.url) {
                console.log(`✅ Muvaffaqiyatli server: ${server}`);
                return response.data.url;
            } 
            
            // Ba'zi serverlar "picker" (tanlov) qaytaradi
            if (response.data && response.data.picker) {
                console.log(`✅ Muvaffaqiyatli server (Picker): ${server}`);
                return response.data.picker[0].url;
            }

        } catch (error) {
            // Xato bersa, logga yozib keyingisiga o'tamiz
            console.log(`❌ ${server} ishlamadi: ${error.message}. Keyingisi...`);
            continue;
        }
    }
    
    console.error("Hamma serverlar band.");
    return null;
}

// --- YOUTUBE UCHUN (YT-DLP) ---
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