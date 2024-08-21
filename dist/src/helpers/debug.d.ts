export type DebugLogLevel = 'log' | 'warn' | 'error';
export default function debug(message: string, { level, }?: {
    level?: DebugLogLevel;
}): void;
