import fs from 'fs';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import splitFile from 'split-file';

dotenv.config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const userId = Number(process.env.USER_ID!);
const bot = new TelegramBot(BOT_TOKEN!);

bot.on('message', (msg) => {
    try {
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
            const fileStream = fs.createWriteStream(path);

            res.pipe(fileStream);
            fileStream.on('finish',async () => {
                fileStream.close();
                console.log('Download Completed');
                await bot.sendMessage(msg.chat.id, 'Download Completed');
                const files = await splitFile.splitFileBySize(path, 45 * 1024 * 1024);
                for (const [index, filePathWithParts] of files.entries()) {
                    const filePath = filePathWithParts.split('.mp4')[0] + index + '.mp4';
                    fs.renameSync(filePathWithParts, filePath);
                    const file = fs.createReadStream(filePath);
                    await bot.sendVideo(msg.chat.id, file);
                }
                const allFiles = fs.readdirSync('./files');
                for (const file of allFiles) {
                    fs.unlink(file, console.log);
                }
            })
        })
    } catch (e) {
        console.log(e);
    }
})

void bot.startPolling();
console.log("Bot Started");
