import fs from 'fs';

export class FileDeletorSerice {
    static errorHandler(err: Error): void {
        if (err) {
            console.log(err);
        }
    }

    static video(path: string): void {
        fs.unlink(path, FileDeletorSerice.errorHandler);
    }

    static photos(filepaths: string[]): void {
        for(const filepath of filepaths) {
            fs.unlink(`../../files/photos/${filepath}`, FileDeletorSerice.errorHandler);
        };
    }
}