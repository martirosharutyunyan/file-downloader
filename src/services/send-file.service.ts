import { WriteStream } from "fs";
import TelegramBot, { EditMessageTextOptions } from "node-telegram-bot-api";
import { MessageService } from "./message.service";
import fs from 'fs';
import { Mutex } from "async-mutex";
import { PercentageService } from "./percentage.service";
import { FileDeletorSerice } from "./file-deletor.service";

export class UploadFileService {
    static async upload(fileStream: WriteStream, bot: TelegramBot, options: { fileName: string, userId: number, path: string, fileSize: number, editMessageTextOptions: EditMessageTextOptions }): Promise<void> {
        fileStream.close();

        console.log('Download Completed: ', options.fileName);
        await MessageService.editText(bot, 'Downloaded: 100%', options.editMessageTextOptions);
        await MessageService.editText(bot, 'Uploaded: 0%', options.editMessageTextOptions);

        const readStream = fs.createReadStream(options.path);
        let uploadedSize = 0;
        let percentage = 0;
        const clientLock = new Mutex();
        readStream.on('data', async (chunk) => {
            const release = await clientLock.acquire();
            const chunkSize = Buffer.byteLength(chunk);
            uploadedSize += chunkSize;

            if (PercentageService.get(uploadedSize, options.fileSize) >= percentage) {
                await MessageService.editText(bot, `Uploaded: ${PercentageService.get(uploadedSize, options.fileSize)}%`, options.editMessageTextOptions);
                percentage += 10;
            }
            release();
        });
        

        // @ts-ignore
        await bot.sendVideo(options.userId, readStream, { supports_streaming: true }, { filename: fileName, contentType: '' }).catch((err) => console.log(err.message));
        await MessageService.editText(bot, 'Uploaded: 100%', options.editMessageTextOptions);
        await MessageService.delete(bot, { userId: options.userId, messageId: options.editMessageTextOptions.message_id!.toString() }).catch((err) => console.log(err.message));
        FileDeletorSerice.video(options.path);
    };
}