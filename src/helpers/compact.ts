export function compact<T extends any[], CompactedArrayElementType extends T extends (infer U)[] ? U : never>(
  obj: T
): Exclude<CompactedArrayElementType, null | undefined>[]
//
export function compact<
  T extends { [key: string]: any },
  NonNullKeys extends {
    [K in keyof T]: T[K] extends undefined | null ? never : K
  }[keyof T],
>(obj: T): { [K in NonNullKeys]: T[K] }
//
export default function compact<
  T extends any[] | { [key: string]: any },
  //
  CompactedArrayElementType extends T extends (infer U)[] ? U : never,
  //
  NonNullKeys extends T extends { [key: string]: any }
    ? {
        [K in keyof T]: T[K] extends undefined | null ? never : K
      }[keyof T]
    : never,
  //
  RetType extends T extends any[]
    ? Exclude<CompactedArrayElementType, null | undefined>[]
    : T extends { [key: string]: any }
      ? { [K in NonNullKeys]: T[K] }
      : never,
>(obj: T): RetType {
  if (Array.isArray(obj)) {
    return obj.filter(val => ![undefined, null].includes(val)) as RetType
  } else {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null)) as RetType
  }
}

// const x = compact(['a', 2, null, undefined])
// const y = compact({ a: 1, b: 'b', c: null, d: undefined })
