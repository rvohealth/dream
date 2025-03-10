import protectAgainstPollutingAssignment from './protectAgainstPollutingAssignment.js'

export default function filterObjectByKey<
  T extends object,
  U extends string[],
  R extends Pick<T, U[number] & keyof T>,
>(obj: T, arr: U): R {
  const workingObj: R = {} as R
  const booleanObj: Record<string, boolean> = {}

  arr.forEach(key => (booleanObj[key] = true))

  arr.forEach(key => {
    if (booleanObj[key]) (workingObj as any)[protectAgainstPollutingAssignment(key)] = (obj as any)[key]
  })

  return workingObj
}
