import * as dotenv from 'dotenv'
import EnvInternal from './EnvInternal'

import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

declare const importMeta: unique symbol
let finalDirname: string

if (typeof importMeta !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  finalDirname = __dirname
} else {
  finalDirname = __dirname
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
