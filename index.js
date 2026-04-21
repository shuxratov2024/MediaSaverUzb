import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import youtubedl from 'youtube-dl-exec'; // E'tibor bering: faqat bitta marta chaqirildi!
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const CHANNEL_USERNAME = '@ccord007'; // <--- Buni o'zgartirishni unutmang

const userLinks = new Map();

// --- 1. MAJBURIY OBUNA ---
const checkSubscription = async (ctx, next) => {
    if (ctx.callbackQuery && ctx.callbackQuery.data === 'check_sub') return next();
    try {
        const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, ctx.from.id);
        if (['member', 'administrator', 'creator'].includes(member.status)) {
            return next(); 
        } else {
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.url("📢 Kanalga a'zo bo'lish", `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`)],
                [Markup.button.callback("✅ Obunani tekshirish", "check_sub")]
            ]);
            return ctx.reply("Botdan foydalanish uchun avval kanalimizga obuna bo'ling!", keyboard);
        }
    } catch (error) {
        return ctx.reply("Kanalni tekshirishda xatolik. Bot kanalda admin ekanligiga ishonch hosil qiling.");
    }
};

bot.use(checkSubscription);

bot.start((ctx) => ctx.reply('Salom! Menga YouTube, Instagram yoki TikTok ssilkasini tashlang.'));

bot.action('check_sub', async (ctx) => {
    try {
        const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, ctx.from.id);
        if (['member', 'administrator', 'creator'].includes(member.status)) {
            await ctx.deleteMessage(); 
            return ctx.reply("Obuna tasdiqlandi. Endi ssilka yuborishingiz mumkin. ✅");
        } else {
            return ctx.answerCbQuery("Hali obuna bo'lmadingiz! ❌", { show_alert: true });
        }
    } catch (error) {
        return ctx.answerCbQuery("Xatolik yuz berdi.", { show_alert: true });
    }
});

// --- 2. SSILKA VA TUGMALAR ---
bot.on('text', async (ctx) => {
    const url = ctx.message.text;
    if (!url.startsWith('http')) return ctx.reply("Iltimos, to'g'ri ssilka yuboring.");

    userLinks.set(ctx.from.id, url);

    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback("🎥 Video", "download_video"),
            Markup.button.callback("🎵 Audio (MP3)", "download_audio")
        ]
    ]);
    await ctx.reply("Nimani yuklab olamiz?", keyboard);
});

// --- 3. VIDEO (STREAM ORQALI - Tezkor, xotiraga saqlamaydi) ---
bot.action('download_video', async (ctx) => {
    const url = userLinks.get(ctx.from.id);
    if (!url) return ctx.answerCbQuery("Ssilka topilmadi. Qaytadan yuboring.", { show_alert: true });

    await ctx.deleteMessage();
    const waitingMsg = await ctx.reply(" yuklanmoqda...");

    try {
        const info = await youtubedl(url, { dumpSingleJson: true, noWarnings: true });
        const videoTitle = (info.title || "Video").replace(/[/\\?%*:|"<>]/g, '-');

        // Qattiq diskka yozmasdan to'g'ridan-to'g'ri Telegramga uzatish
        const videoStream = youtubedl.exec(url, {
            format: 'best',
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            output: '-' 
        }).stdout;

        await ctx.replyWithVideo(
            { source: videoStream, filename: `${videoTitle}.mp4` },
            { caption: `🎬 <b>${videoTitle}</b>\n\n📢 @MediaSaverUzb_bot`, parse_mode: 'HTML' }
        );

    } catch (error) {
        console.error('Video xatoligi:', error);
        ctx.reply("❌ Videoni yuklab olib bo'lmadi.");
    } finally {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitingMsg.message_id).catch(() => {});
        userLinks.delete(ctx.from.id);
    }
});

// --- 4. AUDIO (TEMP PAPKA ORQALI - FFmpeg uchun) ---
bot.action('download_audio', async (ctx) => {
    const url = userLinks.get(ctx.from.id);
    if (!url) return ctx.answerCbQuery("Ssilka topilmadi. Qaytadan yuboring.", { show_alert: true });

    await ctx.deleteMessage();
    const waitingMsg = await ctx.reply("🎧 Audio olinmoqda...");
    const tempFilePath = path.join(os.tmpdir(), `${uuidv4()}.mp3`);

    try {
        const info = await youtubedl(url, { dumpSingleJson: true, noWarnings: true });
        const audioTitle = (info.title || "Audio").replace(/[/\\?%*:|"<>]/g, '-');

        await youtubedl(url, {
            output: tempFilePath,
            extractAudio: true,
            audioFormat: 'mp3',
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            noProgress: true,
            quiet: true
        });

        await ctx.replyWithAudio(
            { source: tempFilePath, filename: `${audioTitle}.mp3` },
            { 
                caption: `🎧 <b>${audioTitle}</b>\n\n📢 @MediaSaverUzb_bot`, 
                parse_mode: 'HTML',
                title: audioTitle,
                
            }
        );

    } catch (error) {
        console.error('Audio xatoligi:', error);
        ctx.reply("❌ Audioni yuklab olib bo'lmadi.");
    } finally {
        await ctx.telegram.deleteMessage(ctx.chat.id, waitingMsg.message_id).catch(() => {});
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath); // Temp faylni o'chiramiz
        userLinks.delete(ctx.from.id);
    }
});

bot.launch();
console.log("🤖 Bot ishga tushdi!");

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));