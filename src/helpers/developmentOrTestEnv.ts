import { envValue } from './envHelpers'

export default function developmentOrTestEnv() {
  return ['development', 'test'].includes(envValue('NODE_ENV') || '')
}
