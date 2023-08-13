export interface ScheduledTask<T> {
    execute(): Promise<T>;
}
