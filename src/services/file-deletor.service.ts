import fs from 'fs';
export class FileDeletorSerice {
    static video(path: string): void {
        fs.unlink(path, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    static photo() {
        
    }
}