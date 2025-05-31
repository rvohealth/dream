import sortBy from './sortBy.js'

export default function sortObjectByValue<T>(
  obj: Record<string, T>,
  valueToCompare: (value: T) => number
): Record<string, T>
export default function sortObjectByValue<T>(
  obj: Record<string, T>,
  valueToCompare: (value: T) => string
): Record<string, T>
export default function sortObjectByValue<T extends string | number>(
  obj: Record<string, T>
): Record<string, T>

export default function sortObjectByValue<T>(
  obj: Record<string, T>,
  valueToCompare: (value: T) => unknown = x => x
) {
  const tuples: [string, T][] = Object.entries(obj)
  const sortedTuples: [string, T][] = sortBy(tuples, (tuple: [string, T]) => {
    const t: T = tuple[1]
    return (valueToCompare as (value: T) => string)(t)
  })

  return sortedTuples.reduce(
    (accumulator, tuple: [string, T]) => {
      ;(accumulator as any)[tuple[0]] = tuple[1]
      return accumulator
    },
    {} as Record<string, T>
  )
}
