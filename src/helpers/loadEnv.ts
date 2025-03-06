import * as dotenv from 'dotenv'
import EnvInternal from './EnvInternal.js'

import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

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

const fileName = `.env${EnvInternal.isTest ? '.test' : ''}`
let dotenvpath: string = ''

if (EnvInternal.boolean('DREAM_CORE_DEVELOPMENT')) {
  dotenvpath = EnvInternal.boolean('DREAM_CORE_SPEC_RUN')
    ? finalDirname + `/../../${fileName}`
    : finalDirname + `/../../../${fileName}`
} else {
  dotenvpath = `../../${fileName}`
}

dotenv.config({ path: dotenvpath })
