import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path)


export class Screenshoter {
    static async take(path: string, fileName: string, count: number): Promise<string[]> {
        return new Promise((res) => {
            let filenames: string[];
            ffmpeg(path).screenshots({
                count,
                filename: `${fileName}thumbnail-at-%s-seconds.jpeg`,
            }, './files/photos')
                .on('error', console.log)
                .on('filenames', (files) => {
                    filenames = files;
                })
                .on('end', () => {
                    res(filenames);
                })
        });
    }
}
