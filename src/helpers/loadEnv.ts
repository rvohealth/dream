import * as dotenv from 'dotenv'

export default function loadEnv() {
  dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' })
}
