import dotenv from 'dotenv'
import EnvInternal from '../../../src/helpers/EnvInternal'

const filePath = `./.env${EnvInternal.isTest ? '.test' : ''}`
dotenv.config({ path: filePath })
