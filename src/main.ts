import fs from 'fs';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const userId = Number(process.env.USER_ID!);
const TELEGRAM_BASE_URL = process.env.TELEGRAM_BASE_URL
const bot = new TelegramBot(BOT_TOKEN!, { baseApiUrl: TELEGRAM_BASE_URL });

bot.on('message', (msg) => {
    try {
        if (msg.chat.id !== userId) {
            return;
        }
        const url = msg.text!;
        const paths = url.split('/');
        const urlBasePath = paths[paths.length - 1];
        const optionIndex = urlBasePath.indexOf('?');
        const fileName = urlBasePath.slice(0, optionIndex);
        const adapter = url.startsWith('https') ? https: http;
        adapter.get(url, async (res) => {
            const path = `./files/${fileName}`;
            const fileStream = fs.createWriteStream(path);

            res.pipe(fileStream);
            fileStream.on('finish',async () => {
                fileStream.close();
                console.log('Download Completed');
                await bot.sendMessage(msg.chat.id, 'Download Completed');
                const readStream = fs.createReadStream(path);
                await bot.sendVideo(msg.chat.id, readStream);
                fs.unlink(path, console.log);
            });
        });
    } catch (e) {
        console.log(e);
    }
})

bot.startPolling().then(() => console.log("Bot Started")).catch(() => console.error("Error cant connect"));
