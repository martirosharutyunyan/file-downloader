import { Mutex } from 'async-mutex';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';
import http from 'http';
import https from 'https';
import TelegramBot from 'node-telegram-bot-api';

import { UserEntity } from './user.entity';

dotenv.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const PASSWORD_HASH = process.env.PASSWORD_HASH!;
const TELEGRAM_BASE_URL = process.env.TELEGRAM_BASE_URL;
const ADMIN_ID = Number(process.env.ADMIN_ID);
const bot = new TelegramBot(BOT_TOKEN!, { baseApiUrl: TELEGRAM_BASE_URL });

const users: UserEntity[] = [new UserEntity(ADMIN_ID, 'Martiros')];

bot.on('message', async (msg) => {
    const text = msg.text!;
    const userId = msg.chat.id;
    const user = users.find((user) => user.userId === userId);

    if (text === '/start') {
        if (!user) {
            await bot.sendMessage(userId, 'Please write password');
        }
        return;
    }


    if (!user) {
        if (!text.includes('/')) {
            const isPasswordRight = bcrypt.compareSync(text, PASSWORD_HASH);

            if (isPasswordRight) {
                users.push(new UserEntity(userId, msg.contact?.first_name));
            } else {
                await bot.sendMessage(userId, 'Incorrect password');
                return;
            }

            await bot.sendMessage(userId, 'Registered');
            return;
        }

        await bot.sendMessage(userId, 'Not Registered please write password');
        return;
    }

    const url = msg.text!;
    const paths = url.split('/');
    const urlBasePath = paths[paths.length - 1];
    const optionIndex = urlBasePath.indexOf('?');
    const fileName = urlBasePath.slice(0, optionIndex);
    const adapter = url.startsWith('https') ? https : http;
    try {
        adapter.get(url, async (res) => {
            if (res.statusCode! >= 400) {
                await bot.sendMessage(userId, `Failed code: ${res.statusCode!}`)
                return;
            }

            const path = `./files/${fileName}`;
            const fileStream = fs.createWriteStream(path);

            const fileSize = Number(res.headers['content-length']);
            let downloadedSize = 0;
            let percentage = 0;
            const clientLock = new Mutex();
            res.pipe(fileStream);
            const getPercentage = (downloadedSize, fileSize) => Math.floor((downloadedSize / fileSize) * 100);
            const message = await bot.sendMessage(userId, `Downloaded: ${getPercentage(downloadedSize, fileSize)}%`);
            const editMessageOptions = { message_id: message.message_id, chat_id: userId }
            res.on('data', async (chunk) => {
                const release = await clientLock.acquire();
                const chunkSize = Buffer.byteLength(chunk);
                downloadedSize += chunkSize;
                
                if (getPercentage(downloadedSize, fileSize) >= percentage) {
                    await editMessageText(bot, `Downloaded: ${getPercentage(downloadedSize, fileSize)}%` , editMessageOptions);
                    percentage += 10;
                }
                release();
            });

            fileStream.on('finish', async () => {
                fileStream.close();

                console.log('Download Completed');
                await editMessageText(bot, 'Downloaded: 100%' , editMessageOptions);
                await editMessageText(bot, 'Uploaded: 0%' , editMessageOptions);

                const readStream = fs.createReadStream(path);
                let uploadedSize = 0;
                let percentage = 0;
                const clientLock = new Mutex();
                readStream.on('data', async (chunk) => {
                    const release = await clientLock.acquire();
                    const chunkSize = Buffer.byteLength(chunk);
                    uploadedSize += chunkSize;

                    if (getPercentage(uploadedSize, fileSize) >= percentage) {
                        await editMessageText(bot, `Uploaded: ${getPercentage(uploadedSize, fileSize)}%`, editMessageOptions);
                        percentage += 10;
                    }
                    release();
                });
                await bot.sendVideo(userId, readStream).catch((err) => console.log(err.message));
                await editMessageText(bot, 'Uploaded: 100%', editMessageOptions);
                await bot.deleteMessage(userId, message.message_id.toString()).catch((err) => console.log(err.message));
                fs.unlink(path, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        })
    } catch (err) {
        await bot.sendMessage(userId, err.message);
    }
});

bot
    .startPolling()
    .then(() => console.log('Bot Started'))
    .catch(() => console.error('Error cant connect'));


const editMessageText = async (bot: TelegramBot, messageText: string, options: TelegramBot.EditMessageTextOptions) => {
    await bot.editMessageText(messageText, options).catch(() => {});
}
