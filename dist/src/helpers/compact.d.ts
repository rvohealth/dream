export declare function compact<T extends any[], CompactedArrayElementType extends T extends (infer U)[] ? U : never>(obj: T): Exclude<CompactedArrayElementType, null | undefined>[];
export declare function compact<T extends {
    [key: string]: any;
}, NonNullKeys extends {
    [K in keyof T]: T[K] extends undefined | null ? never : K;
}[keyof T]>(obj: T): {
    [K in NonNullKeys]: T[K];
};
export default function compact<T extends any[] | {
    [key: string]: any;
}, CompactedArrayElementType extends T extends (infer U)[] ? U : never, NonNullKeys extends T extends {
    [key: string]: any;
} ? {
    [K in keyof T]: T[K] extends undefined | null ? never : K;
}[keyof T] : never, RetType extends T extends any[] ? Exclude<CompactedArrayElementType, null | undefined>[] : T extends {
    [key: string]: any;
} ? {
    [K in NonNullKeys]: T[K];
} : never>(obj: T): RetType;
