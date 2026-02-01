const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

const COBALT_INSTANCES = [
    'https://cobalt.qwedl.com',     // Juda tez
    'https://cobalt.peroxis.me',    // Ba'zan bloklaydi, lekin qayta urinish kerak
    'https://api.cobalt.tools',     // Rasmiy
    'https://cobalt.smartit.hu',    // Yangi zaxira
    'https://cobalt.kwiatekmiki.pl' // Yangi zaxira
];

async function getMediaLink(url) {
    console.log(`[Qidiruv] Link: ${url}`);
    
    for (const server of COBALT_INSTANCES) {
        try {
            const response = await axios.post(server, {
                url: url,
                videoQuality: '720',
                filenameStyle: 'basic'
            }, {
                headers: { 
                    'Accept': 'application/json', 
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0'
                },
                timeout: 12000 // 12 soniya kutamiz
            });

            if (response.data && response.data.url) {
                console.log(`✅ API topdi: ${server}`);
                return { type: 'url', data: response.data.url };
            }
        } catch (error) {
            console.log(`❌ ${server} javob bermadi.`);
            continue; 
        }
    }
    return { type: 'stream', data: getLocalStream(url) };
}

function getLocalStream(url, type = 'video') {
    const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
    const YTDLP_EXE = isRender ? 'yt-dlp' : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
    const FFMPEG_PATH = isRender ? '/usr/bin' : path.join(__dirname, '..', 'bin');

    const args = [
        '--ffmpeg-location', FFMPEG_PATH,
        '--format', type === 'audio' ? 'bestaudio' : 'bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best',
        '--no-playlist', '--quiet', '--no-warnings', '-o', '-', url
    ];
    return spawn(YTDLP_EXE, args, { windowsHide: true }).stdout;
}

module.exports = { getMediaLink, getLocalStream };