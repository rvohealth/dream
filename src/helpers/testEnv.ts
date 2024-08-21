import { envValue } from './envHelpers'

export default function testEnv() {
  return envValue('NODE_ENV') === 'test'
}
