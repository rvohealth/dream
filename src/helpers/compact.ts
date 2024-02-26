export default function compact<
  T extends any,
  R extends T extends (infer Item)[]
    ? Exclude<Item, null | undefined>[]
    : T extends { [key: string]: any }
      ? CompactedObject<T>
      : never,
>(obj: T): R {
  if (Array.isArray(obj)) {
    return obj.filter(val => ![undefined, null].includes(val as any)) as R
  } else {
    return Object.fromEntries(Object.entries(obj as any).filter(([, v]) => v != null)) as R
  }
}

type CompactedObject<T> = { [K in keyof T as T[K] extends null | undefined ? never : K]: T[K] }
