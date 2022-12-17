export class ParallelService {
    static async run(tasks: Promise<void>[]) {
            for (const task of tasks) {
                task.then().catch(err => { throw err });
            }
    }
}
