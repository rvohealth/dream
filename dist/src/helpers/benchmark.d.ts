export type BenchmarkLogLevel = 'log' | 'warn' | 'error';
export default class Benchmark {
    private _start;
    start(): void;
    mark(message: string, level?: BenchmarkLogLevel): void;
}
