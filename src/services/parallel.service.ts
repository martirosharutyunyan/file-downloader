export class ParallelService {
    static async run(tasks: Array<() => Promise<void>>) {
            const taskPromises: Array<Promise<any>> = [];
            for (const task of tasks) {
                taskPromises.push(task())
            }
            await Promise.all(taskPromises);
    }
}
