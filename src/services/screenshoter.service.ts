import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path)
const cwd = process.cwd();


export class Screenshoter {
    static async take(path: string, fileName: string): Promise<string[]> {
        return new Promise((res, rej) => {
            let filenames: string[];
            ffmpeg(path).takeScreenshots({
                count: 4,
                filename: `${fileName}thumbnail-at-%s-seconds.png`,
            },`${cwd}/files/photos`)
                .on('error', rej)
                .on('filenames', (files) => {
                    filenames = files;
                })
                .on('end', () => {
                    res(filenames);
                })
        });
    }
}