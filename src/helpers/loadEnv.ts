import * as dotenv from 'dotenv'

if (process.env.CORE_DEVELOPMENT === '1') {
  dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' })
} else {
  dotenv.config({ path: process.env.NODE_ENV === 'test' ? '../../.env.test' : '../../.env' })
}
