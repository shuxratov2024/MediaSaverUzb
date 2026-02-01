require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getMediaLink, getYouTubeStream } = require('./downloaders'); // getMediaLink nomi muhim!
const http = require('http');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Render serverini uxlatmaslik
http.createServer((req, res) => res.end('Fast Bot Alive!')).listen(process.env.PORT || 3000);

console.log('Bot eng tezkor rejimda ishga tushdi (Cobalt API)!');

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || !text.startsWith('http')) return;

    // Telegramga "Video yuboryapman" deb ko'rsatib turish
    bot.sendChatAction(chatId, 'upload_video');

    try {
        // 1. API dan link olamiz (Juda tez, <1 soniya)
        const directUrl = await getMediaLink(text);

        if (directUrl) {
            // 2. Linkni Telegramga beramiz, Telegram o'zi yuklab oladi
            await bot.sendVideo(chatId, directUrl, {
                caption: "🚀 @MediaSaverUzbBot",
                supports_streaming: true
            });
        } else {
            bot.sendMessage(chatId, "❌ Kechirasiz, videoni topib bo'lmadi. Link xato yoki maxfiy profil.");
        }
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "⚠️ Xatolik yuz berdi.");
    }
});