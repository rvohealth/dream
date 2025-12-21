import { pathToFileURL } from 'node:url'

export default function convertToFileURL(filepath: string) {
  if (filepath.startsWith('/') || /^[A-Za-z]:/.test(filepath)) {
    return pathToFileURL(filepath).href
  }
  return filepath
}
