export default function range<T>(begin: T | null, end?: T | null, excludeEnd?: boolean): Range<T>;
export declare class Range<T> {
    begin: T | null;
    end: T | null;
    excludeEnd?: boolean;
    constructor(begin: T | null, end?: T | null, excludeEnd?: boolean);
}
