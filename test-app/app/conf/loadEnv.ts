import * as dotenv from 'dotenv'
import EnvInternal from '../../../src/helpers/EnvInternal.js'

const filePath = `./.env${EnvInternal.isTest ? '.test' : ''}`
dotenv.config({ path: filePath })
