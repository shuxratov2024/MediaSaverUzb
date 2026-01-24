require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getMediaStream } = require('./downloaders'); // Funksiya nomi to'g'irlandi
const fs = require('fs');

const token = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = '@a722k';
const bot = new TelegramBot(token, { polling: true });

const userStats = {};
const pendingLinks = {}; 

async function checkSubscription(userId) {
    try {
        const member = await bot.getChatMember(CHANNEL_ID, userId);
        return ['creator', 'administrator', 'member'].includes(member.status);
    } catch (e) {
        return false;
    }
}

function showFormatButtons(chatId) {
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🎬 Video (MP4)', callback_data: `dl_video` },
                    { text: '🎵 Audio (MP3)', callback_data: `dl_audio` }
                ]
            ]
        }
    };
    bot.sendMessage(chatId, "Formatni tanlang:", options);
}

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (!text) return;

    if (text === '/start') {
        return bot.sendMessage(chatId, "👋 Salom! Menga YouTube, TikTok yoki Instagram linkini yuboring.");
    }

    if (text.startsWith('http')) {
        pendingLinks[userId] = text;

        if (!userStats[userId]) userStats[userId] = 0;
        userStats[userId]++;

        if (userStats[userId] >= 3) {
            const isSubscribed = await checkSubscription(userId);
            if (!isSubscribed) {
                const joinKeyboard = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "📢 Kanalga obuna bo'lish", url: `https://t.me/a722k` }],
                            [{ text: "✅ Obunani tekshirish", callback_data: `check_sub` }]
                        ]
                    }
                };
                return bot.sendMessage(chatId, `🛑 Botdan foydalanishda davom etish uchun @a722k kanaliga obuna bo'lishingiz shart!`, joinKeyboard);
            }
        }
        showFormatButtons(chatId);
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const url = pendingLinks[userId];

    if (!url && data !== 'check_sub') {
        return bot.answerCallbackQuery(query.id, { text: "Link topilmadi!" });
    }

    if (data === 'check_sub') {
        const isSubscribed = await checkSubscription(userId);
        if (isSubscribed) {
            bot.deleteMessage(chatId, query.message.message_id);
            showFormatButtons(chatId);
        } else {
            bot.answerCallbackQuery(query.id, { text: "Obuna bo'lmagansiz!", show_alert: true });
        }
        return;
    }

    const type = (data === 'dl_video') ? 'video' : 'audio';
    const sentMsg = await bot.sendMessage(chatId, `🚀`);

    try {
        const stream = getMediaStream(url, type);

        if (type === 'video') {
            await bot.sendVideo(chatId, stream, { caption: "✅ @MediaSaverUzb_bot" });
        } else {
            await bot.sendAudio(chatId, stream, { caption: "🎵 @MediaSaverUzb_bot" });
        }

        bot.deleteMessage(chatId, sentMsg.message_id);
        delete pendingLinks[userId];

    } catch (e) {
        console.error("Xatolik:", e.message);
        bot.sendMessage(chatId, "❌ xatolik bo'ldi.");
    }
});

console.log("Bot 100% Stream usulida ishga tushdi!");