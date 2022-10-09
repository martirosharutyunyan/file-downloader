import TelegramBot from "node-telegram-bot-api";

export class MessageService {
    static async editText(bot: TelegramBot, messageText: string, options: TelegramBot.EditMessageTextOptions): Promise<void> {
        await bot.editMessageText(messageText, options).catch(() => { });
    };

    static async delete(bot: TelegramBot, options: { userId: number, messageId: string }): Promise<void> {
        await bot.deleteMessage(options.userId, options.messageId).catch((err) => console.log(err.message));
    }
}