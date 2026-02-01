require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getMediaLink, getLocalStream } = require('./downloaders');
const http = require('http');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

http.createServer((req, res) => res.end('Bot Alive')).listen(process.env.PORT || 3000);

console.log('Bot GIBRID rejimda ishga tushdi!');

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || !text.startsWith('http')) return;

    // YouTube bo'lsa - eski usul (stream)
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
    const processingMsg = await bot.sendMessage(chatId, "⚡️ Yuklanmoqda...");
    
    try {
        // Gibrid yuklash (API yoki yt-dlp)
        const result = await getMediaLink(text);

        if (result.type === 'url') {
            // Agar API ishlagan bo'lsa (URL)
            await bot.sendVideo(chatId, result.data, {
                caption: "📥 @MediaSaverUzbBot (Tezkor)",
                supports_streaming: true
            });
        } else {
            // Agar yt-dlp ishlagan bo'lsa (Stream)
            await bot.sendVideo(chatId, result.data, {
                caption: "📥 @MediaSaverUzbBot (Zaxira)",
                supports_streaming: true
            }, { filename: 'video.mp4', contentType: 'video/mp4' });
        }

        bot.deleteMessage(chatId, processingMsg.message_id).catch(() => {});
    } catch (error) {
        console.error(error);
        bot.editMessageText("❌ Video topilmadi yoki profil yopiq.", {
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

    // YouTube har doim stream
    const stream = getLocalStream(url, data.startsWith('vid_') ? 'video' : 'audio');
    
    if (data.startsWith('vid_')) {
        bot.sendVideo(chatId, stream, { caption: "📥 @MediaSaverUzbBot" });
    } else {
        bot.sendAudio(chatId, stream, { caption: "🎵 @MediaSaverUzbBot" });
    }
});