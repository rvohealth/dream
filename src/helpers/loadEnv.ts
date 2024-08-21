import dotenv from 'dotenv'
import { envBool, envValue } from './envHelpers'

const fileName = `.env${envValue('NODE_ENV') === 'test' ? '.test' : ''}`
let dotenvpath: string = ''

if (envBool('DREAM_CORE_DEVELOPMENT')) {
  dotenvpath = envBool('DREAM_CORE_SPEC_RUN')
    ? __dirname + `/../../${fileName}`
    : __dirname + `/../../../${fileName}`
} else {
  dotenvpath = `../../${fileName}`
}

dotenv.config({ path: dotenvpath })
