require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getMediaLink, getYouTubeStream } = require('./downloaders'); // getMediaLink borligiga ishonch hosil qiling
const http = require('http');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Serverni uxlatmaslik
http.createServer((req, res) => res.end('Bot is running!')).listen(process.env.PORT || 3000);

console.log('Bot yangi Multi-Server tizimida ishga tushdi!');

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || !text.startsWith('http')) return;

    // YouTube tekshiruvi
    if (text.includes('youtube.com') || text.includes('youtu.be')) {
        return bot.sendMessage(chatId, "Formatni tanlang:", {
            reply_markup: {
                inline_keyboard: [[
                    { text: "🎬 Video", callback_data: `vid_${text}` },
                    { text: "🎵 Audio", callback_data: `aud_${text}` }
                ]]
            }
        });
    }

    // Instagram / TikTok
    const processingMsg = await bot.sendMessage(chatId, "🔍 Video qidirilmoqda...");
    
    try {
        // Yangi funksiyani chaqiramiz
        const directUrl = await getMediaLink(text);

        if (directUrl) {
            await bot.sendVideo(chatId, directUrl, {
                caption: "📥 @MediaSaverUzbBot",
                supports_streaming: true
            });
            bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
        } else {
            throw new Error("Link topilmadi");
        }
    } catch (error) {
        console.error(error);
        bot.editMessageText("❌ Serverlar band yoki video topilmadi. Birozdan so'ng urinib ko'ring.", {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });
    }
});

// YouTube Handler
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const url = data.substring(4);

    bot.answerCallbackQuery(query.id);
    bot.deleteMessage(chatId, query.message.message_id).catch(() => {});

    const stream = getYouTubeStream(url, data.startsWith('vid_') ? 'video' : 'audio');
    
    if (data.startsWith('vid_')) {
        bot.sendVideo(chatId, stream, { caption: "📥 @MediaSaverUzbBot" });
    } else {
        bot.sendAudio(chatId, stream, { caption: "🎵 @MediaSaverUzbBot" });
    }
});