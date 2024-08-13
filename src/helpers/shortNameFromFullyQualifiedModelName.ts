import standardizeFullyQualifiedModelName from './standardizeFullyQualifiedModelName'

export default function (str: string): string {
  return standardizeFullyQualifiedModelName(str).split('/').pop()!
}
