import pascalize from './pascalize.js'

export default function standardizeFullyQualifiedModelName(str: string): string {
  return str
    .split('/')
    .map(part => pascalize(part))
    .join('/')
}
