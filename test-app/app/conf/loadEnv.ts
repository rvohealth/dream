import dotenv from 'dotenv'
import { envValue } from '../../../src/helpers/envHelpers'

const filePath = `./.env${envValue('NODE_ENV') === 'test' ? '.test' : ''}`
dotenv.config({ path: filePath })
