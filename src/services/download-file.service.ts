import fs from 'fs';
import { Mutex } from 'async-mutex';
import TelegramBot, { EditMessageTextOptions } from 'node-telegram-bot-api';
import { IncomingMessage } from 'http';
import { MessageService } from './message.service';
import { PercentageService } from './percentage.service';

export class DownloadFileService {
    static async download(bot: TelegramBot, res: IncomingMessage, options: {
        path: string,
        userId: number
    }): Promise<{
        fileStream: fs.WriteStream,
        fileSize: number,
        editMessageTextOptions: EditMessageTextOptions
    }> {
        const fileStream = fs.createWriteStream(options.path);
        fileStream.on("error", console.log)
        const fileSize = Number(res.headers['content-length']);
        let downloadedSize = 0;
        let percentage = 0;
        const clientLock = new Mutex();
        res.pipe(fileStream);
        const message = await bot.sendMessage(options.userId, `Downloaded: ${PercentageService.get(downloadedSize, fileSize)}%`);
        const editMessageTextOptions = { message_id: message.message_id, chat_id: options.userId }
        res.on('data', async (chunk) => {
            const release = await clientLock.acquire();
            const chunkSize = Buffer.byteLength(chunk);
            downloadedSize += chunkSize;

            if (PercentageService.get(downloadedSize, fileSize) >= percentage) {
                await MessageService.editText(bot, `Downloaded: ${PercentageService.get(downloadedSize, fileSize)}%`, editMessageTextOptions);
                percentage += 10;
            }
            release();
        });

        return { fileStream, fileSize, editMessageTextOptions };
    }
}
