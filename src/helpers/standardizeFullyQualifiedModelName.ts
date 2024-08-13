import pascalize from './pascalize'

export default function (str: string): string {
  return str
    .split('/')
    .map(part => pascalize(part))
    .join('/')
}
