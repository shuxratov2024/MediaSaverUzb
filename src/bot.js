require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getMediaStream } = require('./downloaders');
const http = require('http'); // Render uchun kerak

// 1. Telegram Botni sozlash
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error("XATO: .env faylida TELEGRAM_BOT_TOKEN yo'q!");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// 2. Render uchun kichik server (Cron-job shunga "ping" beradi)
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running and healthy!');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server Render uchun portda eshityapti: ${PORT}`);
});

// 3. Bot logikasi
console.log('Bot 100% Stream usulida ishga tushdi!');

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;

    // Start komandasi
    if (text === '/start') {
        return bot.sendMessage(chatId, "Assalomu alaykum! Menga Instagram, TikTok yoki YouTube link yuboring.");
    }

    // Link ekanligini tekshirish
    if (text.startsWith('http')) {
        const waitingMsg = await bot.sendMessage(chatId, "⏳ Video yuklanmoqda... (Biroz kuting)");

        try {
            // Streamni olish
            const stream = getMediaStream(text, 'video');

            // Telegramga video sifatida yuborish
            await bot.sendVideo(chatId, stream, {
                caption: "📥 @MediaSaverUzbBot orqali yuklandi",
                supports_streaming: true
            }, {
                filename: 'video.mp4',
                contentType: 'video/mp4'
            });

            // "Yuklanmoqda" xabarini o'chirish
            bot.deleteMessage(chatId, waitingMsg.message_id).catch(() => {});

        } catch (error) {
            console.error("Bot Xatosi:", error);
            bot.editMessageText("❌ Kechirasiz, bu videoni yuklab bo'lmadi. Linkni tekshirib ko'ring.", {
                chat_id: chatId,
                message_id: waitingMsg.message_id
            });
        }
    }
});