import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

declare const importMeta: unique symbol
let finalDirname: string

if (typeof importMeta !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const __filename = fileURLToPath(import.meta.url)
  finalDirname = dirname(__filename)
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    finalDirname = __dirname
  } catch {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const __filename = fileURLToPath(import.meta.url)
    finalDirname = dirname(__filename)
  }
}

export default function srcPath(...paths: string[]) {
  // this is the path to the test-app folder, but
  // in a real project, this would be the path to the
  // src folder
  const pathToSrc = join(finalDirname, '..', '..')
  return join(pathToSrc, ...paths)
}
