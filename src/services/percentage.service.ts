export class PercentageService {
    static get = (downloadedSize: number, fileSize: number) => Math.floor((downloadedSize / fileSize) * 100)
}