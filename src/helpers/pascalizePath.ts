import pascalize from './pascalize.js.js'

export default function pascalizePath(path: string) {
  return path
    .split('/')
    .map(namePart => pascalize(namePart))
    .join('')
}
