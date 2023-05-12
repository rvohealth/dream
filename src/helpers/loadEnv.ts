import dotenv from 'dotenv'

if (process.env.DREAM_CORE_DEVELOPMENT === '1') {
  dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' })
} else {
  dotenv.config({ path: process.env.NODE_ENV === 'test' ? '../../.env.test' : '../../.env' })
}
