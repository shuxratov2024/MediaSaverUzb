async function checkSubscription(ctx) {
    try {
        const member = await ctx.api.getChatMember(process.env.CHANNEL_ID, ctx.from.id);
        const allowed = ["member", "administrator", "creator"];
        return allowed.includes(member.status);
    } catch (error) {
        return false; 
    }
}
module.exports = { checkSubscription };