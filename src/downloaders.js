const { spawn } = require('child_process');
const path = require('path');

// Render (Linux) yoki Windows ekanligini aniqlash
const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

// Renderda tizimning o'zidan, Windowsda bin papkasidan oladi
const YTDLP_EXE = isRender ? 'yt-dlp' : path.join(__dirname, '..', 'bin', 'yt-dlp.exe');
const FFMPEG_PATH = isRender ? '/usr/bin' : path.join(__dirname, '..', 'bin');

function getMediaStream(url, type = 'video') {
    // Formatni tanlash:
    // Audio uchun: eng yaxshi audio
    // Video uchun: [vcodec^=avc] bu H.264 kodeki (oq ekran bo'lmaydi)
    const formatSelection = type === 'audio' 
        ? 'bestaudio/best' 
        : 'bestvideo[vcodec^=avc]+bestaudio[acodec^=mp4a]/best[ext=mp4]/best';

    const args = [
        '--ffmpeg-location', FFMPEG_PATH,
        '--format', formatSelection,
        '--merge-output-format', 'mp4', // Majburan MP4 qilish
        '--no-playlist',
        '--no-check-certificate',
        
        // Videoni faylga yozmay, to'g'ridan-to'g'ri Telegramga uzatish (Stream)
        '-o', '-', 
        url
    ];

    console.log(`Yuklash boshlandi (Mode: ${isRender ? 'Server' : 'Local'}): ${url}`);

    // Jarayonni boshlash
    const ytProcess = spawn(YTDLP_EXE, args);

    // Xatolarni logga chiqarish (debug uchun)
    ytProcess.stderr.on('data', (data) => {
        // Loglarni juda ko'paytirmaslik uchun faqat errorlarni ko'rsatish mumkin
        // console.log("YT-DLP Log:", data.toString()); 
    });

    ytProcess.on('error', (err) => {
        console.error("YT-DLP Xatosi:", err);
    });

    return ytProcess.stdout; // Streamni qaytaradi
}

module.exports = { getMediaStream };