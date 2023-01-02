import { interval } from 'rxjs';
import { ParallelService } from "./parallel.service";
const MAX_PARALLEL_UPLOAD_COUNT = 2;

export class EventService {
    tasks: Array<() => Promise<void>> = [];
    blockStatus = false;

    constructor() {
        interval(1000).subscribe(async () => {
            if (this.blockStatus) return;
            if (this.tasks.length > 0 && !this.blockStatus) {
                this.blockStatus = true;
                const tasks: Array<() => Promise<void>> = [];
                for (let i = 0; i < MAX_PARALLEL_UPLOAD_COUNT; i++) {
                    const firstTask = this.tasks.shift();
                    if (firstTask) {
                        tasks.push(firstTask)
                    }
                }
                await ParallelService.run(tasks);
                this.blockStatus = false;
            }
        })
    }

    push(task: () => Promise<void>) {
        this.tasks.push(task);
    }
}


