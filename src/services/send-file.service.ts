import { WriteStream } from "fs";
import { Mutex } from "async-mutex";
import fs from 'fs';
import TelegramBot, { EditMessageTextOptions, InputMedia, InputMediaPhoto, InputMediaVideo } from "node-telegram-bot-api";
import { MessageService } from "./message.service";
import { PercentageService } from "./percentage.service";
import { FileDeletorSerice } from "./file-deletor.service";
import { Screenshoter } from "./screenshoter.service";

export class SendFileService {
    static async upload(fileStream: WriteStream, bot: TelegramBot, options: {
        fileName: string,
        downloadStartDate: Date,
        userId: number,
        path: string,
        fileSize: number,
        editMessageTextOptions: EditMessageTextOptions,
        count: number,
    }): Promise<void> {
        fileStream.close();

        console.log(`Download Completed: ${options.fileName} ${(+new Date() - +options.downloadStartDate) / 1000}s`);
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
        const screenShotStartDate = new Date();
        const screenshotFiles = await Screenshoter.take(options.path, options.fileName, options.count);
        console.log(`Screenshots done ${(+new Date() - +screenShotStartDate) / 1000}s`)
        const mediaGroup: InputMedia[] = [];
        for (const screenshotFile of screenshotFiles) {
            mediaGroup.push({
                type: 'photo',
                media: `./files/photos/${screenshotFile}`,
            });
        };
        // @ts-ignore
        const video: InputMediaVideo = { media: options.path, type: 'video', supports_streaming: true, thumb: `./files/photos/${screenshotFiles[0]}` };
        mediaGroup.push(video);
        await bot.sendMediaGroup(options.userId, mediaGroup);
        await MessageService.editText(bot, 'Uploaded: 100%', options.editMessageTextOptions);
        await MessageService.delete(bot, { userId: options.userId, messageId: options.editMessageTextOptions.message_id!.toString() }).catch((err) => console.log(err.message));
        FileDeletorSerice.video(options.path);
        FileDeletorSerice.photos(screenshotFiles);
    };
}