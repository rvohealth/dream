import * as dotenv from 'dotenv'
import EnvInternal from '../../../src/helpers/EnvInternal.js'

if (!process.env.NODE_ENV) {
  ;(process.env as { NODE_ENV?: string }).NODE_ENV = 'test'
}

const filePath = `./.env${EnvInternal.isTest ? '.test' : ''}`
dotenv.config({ path: filePath })
