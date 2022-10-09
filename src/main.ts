import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import TelegramBot from 'node-telegram-bot-api';
import { UserEntity } from './entities/user.entity';
import { DownloadFileService } from './services/download-file.service';
import { UploadFileService } from './services/send-file.service';

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
            await bot.deleteMessage(userId, msg.message_id.toString());

            const path = `./files/videos/${fileName}`;
            const { fileStream, fileSize, editMessageTextOptions } = await DownloadFileService.download(bot, res, { fileName, userId });
            fileStream.on('finish', () => UploadFileService.upload(fileStream, bot, { fileName, fileSize, userId, path, editMessageTextOptions }));
        }).on('error', console.log)
    } catch (err) {
        await bot.sendMessage(userId, err.message);
    }
});

bot
    .startPolling()
    .then(() => console.log('Bot Started'))
    .catch(() => console.error('Error cant connect'));
