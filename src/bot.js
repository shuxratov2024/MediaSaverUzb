require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getYouTubeStream, getSocialMediaLink } = require('./downloaders');
const http = require('http');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Serverni uxlatmaslik
http.createServer((req, res) => res.end('Bot is alive!')).listen(process.env.PORT || 3000);

console.log('Bot ishga tushdi (API Mode)');

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || !text.startsWith('http')) return;

    // Link turini aniqlash
    const isYouTube = text.includes('youtube.com') || text.includes('youtu.be');
    
    // --- YOUTUBE BO'LSA ---
    if (isYouTube) {
        bot.sendMessage(chatId, "Formatni tanlang:", {
            reply_markup: {
                inline_keyboard: [[
                    { text: "🎬 Video", callback_data: `vid_${text}` },
                    { text: "🎵 Audio", callback_data: `aud_${text}` }
                ]]
            }
        });
        return;
    }

    // --- INSTAGRAM / TIKTOK BO'LSA ---
    const processingMsg = await bot.sendMessage(chatId, "⏳ API orqali yuklanmoqda...");

    try {
        // 1. API dan to'g'ridan-to'g'ri link olamiz
        const directUrl = await getSocialMediaLink(text);

        if (directUrl) {
            // 2. Telegramga o'sha linkni yuboramiz (Telegram o'zi serverdan tortib oladi)
            await bot.sendVideo(chatId, directUrl, {
                caption: "📥 @MediaSaverUzbBot",
                supports_streaming: true
            });
            bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
        } else {
            throw new Error("Link topilmadi");
        }
    } catch (error) {
        bot.editMessageText("❌ Kechirasiz, bu videoni yuklab bo'lmadi. Blokirovka kuchli.", {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });
    }
});

// YouTube tugmalari
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const url = data.substring(4);

    bot.answerCallbackQuery(query.id);
    bot.deleteMessage(chatId, query.message.message_id).catch(() => {});
    
    // YouTube hali ham yt-dlp ishlatadi
    const stream = getYouTubeStream(url, data.startsWith('vid_') ? 'video' : 'audio');
    
    if (data.startsWith('vid_')) {
        bot.sendVideo(chatId, stream, { caption: "📥 @MediaSaverUzbBot" });
    } else {
        bot.sendAudio(chatId, stream, { caption: "🎵 @MediaSaverUzbBot" });
    }
});