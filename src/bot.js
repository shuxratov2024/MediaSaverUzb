require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getMediaStream } = require('./downloaders');
const http = require('http');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Render serverini uxlatmaslik
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot ishlayapti!');
});
server.listen(process.env.PORT || 3000);

console.log('Bot ishga tushdi! (Instagram/TikTok avto, YouTube tugma bilan)');

// URL turini aniqlash funksiyasi
const getPlatform = (url) => {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    return 'other';
};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return;
    if (text === '/start') {
        return bot.sendMessage(chatId, "Link yuboring (Instagram, TikTok, YouTube).");
    }

    if (text.startsWith('http')) {
        const platform = getPlatform(text);

        // 1. Agar YOUTUBE bo'lsa - Tugma chiqaramiz
        if (platform === 'youtube') {
            return bot.sendMessage(chatId, "Formatni tanlang:", {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🎬 Video (MP4)", callback_data: `vid_${text}` },
                            { text: "🎵 Audio (MP3)", callback_data: `aud_${text}` }
                        ]
                    ]
                }
            });
        }

        // 2. Agar INSTAGRAM yoki TIKTOK bo'lsa - Srazu video yuklaymiz
        // Bu foydalanuvchini kutish vaqtini kamaytiradi
        const processingMsg = await bot.sendMessage(chatId, "⏳ Yuklanmoqda...");
        
        try {
            const stream = getMediaStream(text, 'video');
            
            await bot.sendVideo(chatId, stream, {
                caption: "📥 @MediaSaverUzbBot",
                supports_streaming: true
            }, {
                filename: 'video.mp4',
                contentType: 'video/mp4'
            });

            bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
        } catch (error) {
            console.error(error);
            bot.editMessageText("❌ Xatolik bo'ldi. Linkni tekshiring.", {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });
        }
    }
});

// YouTube tugmalari uchun handler
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const url = data.substring(4); // "vid_" yoki "aud_" ni olib tashlaymiz

    // Tugmani yo'qotish va "Yuklanmoqda" deyish
    bot.answerCallbackQuery(query.id);
    bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
    const processingMsg = await bot.sendMessage(chatId, "⏳ YouTube yuklanmoqda...");

    try {
        if (data.startsWith('vid_')) {
            // Video yuklash
            const stream = getMediaStream(url, 'video');
            await bot.sendVideo(chatId, stream, {
                caption: "📥 @MediaSaverUzbBot",
                supports_streaming: true
            }, { filename: 'video.mp4', contentType: 'video/mp4' });
        } else {
            // Audio yuklash
            const stream = getMediaStream(url, 'audio');
            await bot.sendAudio(chatId, stream, {
                caption: "🎵 @MediaSaverUzbBot",
                title: "Audio Track"
            }, { filename: 'audio.mp3', contentType: 'audio/mpeg' });
        }
        bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
    } catch (error) {
        bot.editMessageText("❌ Xatolik: " + error.message, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });
    }
});