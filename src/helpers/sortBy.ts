/**
 * Returns a copy of the array, sorted by the value returned by calling the function in the second argument on each element in the array
 * Returns a copy of the array sorted by the return value of the function passed as the second argument.
 * ```ts
 * import { sortBy } from '@rvoh/dream'
 *
 * sortBy(['aaa', 'a', 'aa'], (str: string) => str.length)
 * // ['a', 'aa', 'aaa']
 *
 * sortBy(['aaa', 'a', 'aa'], (str: string) => -str.length)
 * // ['aaa', 'aa', 'a']
 *
 * sortBy([5, 3, 7], (num: number) => num)
 * // [3, 5, 7]
 *
 * sortBy([5, 3, 7], (num: number) => -num)
 * // [7, 5, 3]
 * ```
 */
export default function sortBy<T>(array: T[], valueToCompare: (value: T) => number | string | bigint): T[] {
  const arrayClone = [...array]
  return arrayClone.sort((a: T, b: T) => {
    const aPrime = valueToCompare(a)
    const bPrime = valueToCompare(b)

    if (typeof aPrime === 'string' && typeof bPrime === 'string') return aPrime.localeCompare(bPrime)
    if (typeof aPrime === 'number' && typeof bPrime === 'number') return aPrime - bPrime
    if (typeof aPrime === 'bigint' && typeof bPrime === 'bigint')
      return aPrime.toString().localeCompare(bPrime.toString())
    throw new UnsupportedValueFromComparisonFunction(aPrime, bPrime)
  })
}

export class UnsupportedValueFromComparisonFunction extends Error {
  constructor(
    private aPrime: any,
    private bPrime: any
  ) {
    super()
  }

  public get message() {
    return `Value incompatible with compare: ${this.aPrime}, ${this.bPrime}`
  }
}
