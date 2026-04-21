require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const youtubedl = require('youtube-dl-exec');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Kanal usernamesi (yoki -100 bilan boshlanadigan ID si)
const CHANNEL_USERNAME = '@ccord007'; 

// --- MAJBURIY OBUNA MIDDLEWARE'I ---
const checkSubscription = async (ctx, next) => {
    // Agar foydalanuvchi obunani tekshirish tugmasini bossa, davom etishiga ruxsat beramiz
    if (ctx.callbackQuery && ctx.callbackQuery.data === 'check_sub') {
        return next();
    }

    try {
        const userId = ctx.from.id;
        const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, userId);

        // Foydalanuvchi kanalda bormi?
        if (['member', 'administrator', 'creator'].includes(member.status)) {
            return next(); // Hammasi joyida, keyingi kodlarga o'tkazib yuboramiz
        } else {
            // Obuna bo'lmagan bo'lsa, xabar va tugma chiqaramiz
            const keyboard = Markup.inlineKeyboard([
                [Markup.button.url("📢 Kanalga a'zo bo'lish", `https://t.me/${CHANNEL_USERNAME.replace('@', '')}`)],
                [Markup.button.callback("✅ Obunani tekshirish", "check_sub")]
            ]);
            
            return ctx.reply("Botdan foydalanish uchun avval rasmiy kanalimizga obuna bo'ling!", keyboard);
        }
    } catch (error) {
        console.error("Obunani tekshirishda xatolik:", error);
        return ctx.reply("Kanalni tekshirishda xatolik yuz berdi. Dasturchi botni kanalga admin qilganiga ishonch hosil qiling.");
    }
};

// Barcha xabarlar va komandalar avval shu middleware'dan o'tadi
bot.use(checkSubscription);

// --- ASOSIY BOT MANTIQI ---

bot.start((ctx) => ctx.reply('Salom! Menga YouTube, Instagram yoki TikTok ssilkasini tashlang.'));

// "Obunani tekshirish" tugmasi bosilganda ishlaydigan mantiq
bot.action('check_sub', async (ctx) => {
    try {
        const member = await ctx.telegram.getChatMember(CHANNEL_USERNAME, ctx.from.id);
        if (['member', 'administrator', 'creator'].includes(member.status)) {
            await ctx.deleteMessage(); // Tekshirish xabarini o'chirib tashlaymiz
            return ctx.reply("Rahmat! Obuna tasdiqlandi. Endi ssilka yuborishingiz mumkin. ✅");
        } else {
            return ctx.answerCbQuery("Hali obuna bo'lmadingiz! ❌", { show_alert: true });
        }
    } catch (error) {
        return ctx.answerCbQuery("Xatolik yuz berdi.", { show_alert: true });
    }
});

// Ssilka kelganda ishlaydigan qism (Faqat obuna bo'lganlargacha yetib keladi)
bot.on('text', async (ctx) => {
    const url = ctx.message.text;

    if (!url.startsWith('http')) return ctx.reply("Iltimos, to'g'ri ssilka yuboring.");

    ctx.reply('Yuklanmoqda, biroz kuting...');

    try {
        const output = await youtubedl(url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
        });

        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            await ctx.replyWithVideo({ url: output.url }); 
        } else {
            const videoUrl = output.url;
            if (videoUrl) {
                await ctx.replyWithVideo({ url: videoUrl });
            } else {
                ctx.reply("Kontentni yuklab olishda xatolik yuz berdi.");
            }
        }
    } catch (error) {
        console.error('Xato:', error);
        ctx.reply("Kechirasiz, ushbu ssilkani yuklab olib bo'lmadi.");
    }
});

bot.launch();
console.log('Bot ishga tushdi!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));