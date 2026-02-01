const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

const COBALT_INSTANCES = [
    'https://cobalt.qwedl.com',     // JAHONDA ENG TEZ (Hozirgi holatda)
    'https://cobalt.peroxis.me',    // Juda barqaror
    'https://api.cobalt.tools',     // Rasmiy (Lekin ko'p band bo'ladi)
    'https://cobalt.firefart.at'    // Yaxshi zaxira
];

async function getMediaLink(url) {
    console.log(`[Qidiruv] Link: ${url}`);
    for (const server of COBALT_INSTANCES) {
        try {
            const response = await axios.post(server, {
                url: url,
                videoQuality: '720'
            }, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                timeout: 8000 // 8 soniya kutamiz
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
    // Agar hech bir API topmasa, yt-dlp (zaxira)
    return { type: 'stream', data: getLocalStream(url) };
}

// getLocalStream funksiyasi avvalgidek qoladi...
function getLocalStream(url, type = 'video') {
    const isRender = process.env.RENDER === 'true';
    const YTDLP_EXE = isRender ? 'yt-dlp' : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
    const FFMPEG_PATH = isRender ? '/usr/bin' : path.join(__dirname, '..', 'bin');

    const args = [
        '--ffmpeg-location', FFMPEG_PATH,
        '--format', type === 'audio' ? 'bestaudio' : 'bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        '--no-playlist', '--quiet', '-o', '-', url
    ];
    return spawn(YTDLP_EXE, args, { windowsHide: true }).stdout;
}

module.exports = { getMediaLink, getLocalStream };