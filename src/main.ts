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
const bot = new TelegramBot(BOT_TOKEN!, { baseApiUrl: TELEGRAM_BASE_URL });

const users: UserEntity[] = [];

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
            if (res.statusCode! >= 300) {
                await bot.sendMessage(userId, `Failed code: ${res.statusCode!}`)
                return;
            }
            
            const path = `./files/${fileName}`;
            const fileStream = fs.createWriteStream(path);

            res.pipe(fileStream);
            fileStream.on('finish', async () => {
                fileStream.close();
                console.log('Download Completed');
                await bot.sendMessage(userId, 'Download Completed');
                const readStream = fs.createReadStream(path);
                await bot.sendVideo(userId, readStream);

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
