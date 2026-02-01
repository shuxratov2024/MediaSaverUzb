const axios = require('axios');

async function getMediaLink(url) {
    try {
        // Cobalt API - Hozirgi kunda eng tezi
        // Biz serverga hech narsa yuklab olmaymiz (disk to'lmaydi)
        const response = await axios.post('https://api.cobalt.tools/api/json', {
            url: url,
            vCodec: 'h264',     // Telegram yaxshi ko'radigan format
            vQuality: '720',    // Sifat (480, 720, 1080, max)
            aFormat: 'mp3',
            filenamePattern: 'basic',
            isAudioOnly: false
        }, {
            headers: {
                'Accept': 'application/json',
                // Serverni oddiy brauzer deb aldash
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // API bizga status va url qaytaradi
        if (response.data && response.data.status === 'stream' || response.data.status === 'redirect') {
            return response.data.url;
        } else if (response.data.picker) {
            // Agar video bir nechta bo'lsa (masalan karusel), birinchisini olamiz
            return response.data.picker[0].url; 
        } else {
            return null;
        }

    } catch (error) {
        console.error("API Xatosi:", error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = { getMediaLink };