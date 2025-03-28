import { RelaxedJoinStatement } from '../types/dream.js'

export default function objectPathsToArrays(obj: RelaxedJoinStatement): string[][] {
  const completePaths: string[][] = []
  const workingPath: string[] = []

  depthFirstSearch(obj, workingPath, completePaths)

  return completePaths
}

function depthFirstSearch(obj: RelaxedJoinStatement, workingPath: string[], completePaths: string[][]) {
  return Object.keys(obj).forEach(key => {
    const subObj = obj[key]

    if (subObj && Object.keys(subObj).length) {
      depthFirstSearch(obj[key] as RelaxedJoinStatement, [...workingPath, key], completePaths)
    } else {
      completePaths.push([...workingPath, key])
    }
  })
}
