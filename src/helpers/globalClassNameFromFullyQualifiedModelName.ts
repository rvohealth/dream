import standardizeFullyQualifiedModelName from './standardizeFullyQualifiedModelName.js'

export default function (str: string): string {
  return standardizeFullyQualifiedModelName(str).replace(/\//g, '')
}
