import pascalize from './pascalize'

export default function pascalizePath(path: string) {
  return path
    .split('/')
    .map(namePart => pascalize(namePart))
    .join('')
}
