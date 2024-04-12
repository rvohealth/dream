import { Decrement, Inc } from '../helpers/typeutils'

export type Primitive = null | undefined | string | number | boolean | symbol | bigint

type ArrayKey = number

type IsTuple<T extends readonly any[]> = number extends T['length'] ? false : true

type TupleKeys<T extends readonly any[]> = Exclude<keyof T, keyof any[]>

export type PathConcat<
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations,
  TKey extends string | number,
  TValue,
  Depth extends number,
  NextTableName extends (SyncedAssociations[TableName][TKey & keyof SyncedAssociations[TableName]] &
    (keyof SyncedAssociations)[])[0] &
    keyof SyncedAssociations = (SyncedAssociations[TableName][TKey & keyof SyncedAssociations[TableName]] &
    (keyof SyncedAssociations)[])[0] &
    keyof SyncedAssociations,
> = Depth extends 7
  ? never
  : TValue extends Primitive
    ? `${TKey}`
    : `${TKey}` | `${TKey}.${Path<SyncedAssociations, NextTableName, Inc<Depth>>}`

export type Path<
  SyncedAssociations extends object,
  TableName extends keyof SyncedAssociations,
  Depth extends number = 0,
> = SyncedAssociations[TableName] extends readonly (infer V)[]
  ? IsTuple<SyncedAssociations[TableName]> extends true
    ? {
        [K in TupleKeys<SyncedAssociations[TableName]>]-?: PathConcat<
          SyncedAssociations,
          TableName,
          K & string,
          SyncedAssociations[TableName][K],
          Depth
        >
      }[TupleKeys<SyncedAssociations[TableName]>]
    : PathConcat<SyncedAssociations, TableName, ArrayKey, V, Depth>
  : {
      [K in keyof SyncedAssociations[TableName]]-?: PathConcat<
        SyncedAssociations & object,
        TableName,
        K & string,
        SyncedAssociations[TableName][K],
        Depth
      >
    }[keyof SyncedAssociations[TableName]]

type ArrayPathConcat<TKey extends string | number, TValue> = TValue extends Primitive
  ? never
  : TValue extends readonly (infer U)[]
    ? U extends Primitive
      ? never
      : `${TKey}` | `${TKey}.${ArrayPath<TValue>}`
    : `${TKey}.${ArrayPath<TValue>}`

export type ArrayPath<T> = T extends readonly (infer V)[]
  ? IsTuple<T> extends true
    ? {
        [K in TupleKeys<T>]-?: ArrayPathConcat<K & string, T[K]>
      }[TupleKeys<T>]
    : ArrayPathConcat<ArrayKey, V>
  : {
      [K in keyof T]-?: ArrayPathConcat<K & string, T[K]>
    }[keyof T]

export type PathValue<T, TPath extends Path<T> | ArrayPath<T>> = T extends any
  ? TPath extends `${infer K}.${infer R}`
    ? K extends keyof T
      ? R extends Path<T[K]>
        ? undefined extends T[K]
          ? PathValue<T[K], R> | undefined
          : PathValue<T[K], R>
        : never
      : K extends `${ArrayKey}`
        ? T extends readonly (infer V)[]
          ? PathValue<V, R & Path<V>>
          : never
        : never
    : TPath extends keyof T
      ? T[TPath]
      : TPath extends `${ArrayKey}`
        ? T extends readonly (infer V)[]
          ? V
          : never
        : never
  : never
