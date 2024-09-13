import { RelaxedJoinsStatement } from '../dream/types'

export default function objectPathsToArrays(obj: RelaxedJoinsStatement): string[][] {
  const completePaths: string[][] = []
  const workingPath: string[] = []

  depthFirstSearch(obj, workingPath, completePaths)

  return completePaths
}

function depthFirstSearch(obj: RelaxedJoinsStatement, workingPath: string[], completePaths: string[][]) {
  return Object.keys(obj).forEach(key => {
    if (Object.keys(obj[key]).length) {
      depthFirstSearch(obj[key] as RelaxedJoinsStatement, [...workingPath, key], completePaths)
    } else {
      completePaths.push([...workingPath, key])
    }
  })
}
