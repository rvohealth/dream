import { IdType } from '../dream/types.js'

export default function sortBy<T>(
  array: T[],
  valueToCompare: (value: T) => number | string | bigint | IdType
): T[] {
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
