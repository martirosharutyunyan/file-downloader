import fs from 'fs';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'

dotenv.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const userId = Number(process.env.USER_ID!);
const bot = new TelegramBot(BOT_TOKEN!);

bot.on('message', (msg) => {
    if (msg.chat.id !== userId) {
        return;
    }
    const url = msg.text!.split('?')[0];
    const paths = url.split('/');
    const fileName = paths[paths.length - 1];
    const adapter = url.startsWith('https') ? https: http;
    adapter.get(url, (res) => {
        // Image will be stored at this path
        const path = `./files/${fileName}`;
        const filePath = fs.createWriteStream(path);
        res.pipe(filePath);
        filePath.on('finish',async () => {
            filePath.close();
            console.log('Download Completed');
            const file = fs.readFileSync(path);
            await bot.sendVideo(msg.chat.id, file)
            try {
                fs.unlinkSync(path+'fds');
            } catch (e) {
                console.log(e)
            }
        })
    })
})

void bot.startPolling();
console.log("Bot Started");
