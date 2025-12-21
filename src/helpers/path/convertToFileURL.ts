import { pathToFileURL } from 'node:url'

export default function convertToFileURL(path: string) {
  if (path.startsWith('/') || /^[A-Za-z]:/.test(path)) {
    return pathToFileURL(path).href
  }
  return path
}
