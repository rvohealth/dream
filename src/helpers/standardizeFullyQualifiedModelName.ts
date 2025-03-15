import pascalize from './pascalize.js.js'

export default function (str: string): string {
  return str
    .split('/')
    .map(part => pascalize(part))
    .join('/')
}
