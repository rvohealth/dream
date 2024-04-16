type Foo = {
  user: {
    description: {
      name: string
      surname: string
    }
  }
}

declare var foo: Foo

/**
 * Common utils
 */

type Primitives = string | number | symbol

type Values<T> = T[keyof T]

type Elem = string

type Acc = Record<string, any>

// (acc, elem) => hasProperty(acc, elem) ? acc[elem] : acc
type Predicate<Accumulator extends Acc, El extends Elem> = El extends keyof Accumulator
  ? Accumulator[El]
  : Accumulator

type Reducer<Keys extends ReadonlyArray<Elem>, Accumulator extends Acc = {}> =
  /**
   *  If Keys is empty array, no need to call recursion,
   *  just return Accumulator
   */
  Keys extends []
    ? Accumulator
    : /**
       * If keys is one element array,
       *
       */
      Keys extends [infer H]
      ? H extends Elem
        ? /**
           * take this element and call predicate
           */
          Predicate<Accumulator, H>
        : never
      : /**
         * If Keys is an Array of more than one element
         */
        Keys extends readonly [infer H, ...infer Tail]
        ? Tail extends ReadonlyArray<Elem>
          ? H extends Elem
            ? /**
               * Call recursion with Keys Tail
               * and call predicate with first element
               */
              Reducer<Tail, Predicate<Accumulator, H>>
            : never
          : never
        : never

const hasProperty = <Obj, Prop extends Primitives>(obj: Obj, prop: Prop): obj is Obj & Record<Prop, any> =>
  Object.prototype.hasOwnProperty.call(obj, prop)

/**
 * Fisrt approach
 *
 */

type KeysUnion<T, Cache extends Array<Primitives> = []> = T extends Primitives
  ? Cache
  : {
      [P in keyof T]: [...Cache, P] | KeysUnion<T[P], [...Cache, P]>
    }[keyof T]

type ValuesUnion<T, Cache = T> = T extends Primitives
  ? T
  : Values<{
      [P in keyof T]: Cache | T[P] | ValuesUnion<T[P], Cache | T[P]>
    }>

function deepPickFinal<Obj, Keys extends KeysUnion<Obj> & ReadonlyArray<string>>(
  obj: ValuesUnion<Obj>,
  ...keys: Keys
): Reducer<Keys, Obj>

function deepPickFinal<Obj, Keys extends KeysUnion<Obj> & Array<string>>(
  obj: ValuesUnion<Obj>,
  ...keys: Keys
) {
  return keys.reduce((acc, elem) => (hasProperty(acc, elem) ? acc[elem] : acc), obj)
}

/**
 * Ok
 */
const result = deepPickFinal(foo, 'user') // ok
const result2 = deepPickFinal(foo, 'user') // ok
const result3 = deepPickFinal(foo, 'user', 'description', 'name') // ok
const result4 = deepPickFinal(foo, 'user', 'description', 'surname') // ok

/**
 * Expected errors
 */
// const result5 = deepPickFinal(foo, 'surname')
// const result6 = deepPickFinal(foo, 'description')
// const result7 = deepPickFinal(foo)
