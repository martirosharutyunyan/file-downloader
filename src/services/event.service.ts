import { EventEmitter } from 'events';
import rxjs from 'rxjs';
import {ParallelService} from "./parallel.service";
const MAX_PARALLEL_UPLOAD_COUNT = 2;

export class EventService {
    tasks: Promise<void>[] = [];

    constructor() {
        rxjs.interval(1000).subscribe(() => {
            if (this.tasks.length > 0) {
                const tasks: Promise<void>[] = [];
                for (let i = 0; i < MAX_PARALLEL_UPLOAD_COUNT; i++) {
                    tasks.push(this.tasks.shift()!);
                }
                ParallelService.run(tasks);
            }
        })
    }

    push(task: Promise<void>) {
        this.tasks.push(task);
    }
}


