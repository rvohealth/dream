import * as dotenv from 'dotenv'
import EnvInternal from './EnvInternal'

import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fileName = `.env${EnvInternal.isTest ? '.test' : ''}`
let dotenvpath: string = ''

if (EnvInternal.boolean('DREAM_CORE_DEVELOPMENT')) {
  dotenvpath = EnvInternal.boolean('DREAM_CORE_SPEC_RUN')
    ? __dirname + `/../../${fileName}`
    : __dirname + `/../../../${fileName}`
} else {
  dotenvpath = `../../${fileName}`
}

dotenv.config({ path: dotenvpath })
