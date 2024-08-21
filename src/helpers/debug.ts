import { envBool, envValue } from './envHelpers'

export type DebugLogLevel = 'log' | 'warn' | 'error'

export default function debug(
  message: string,
  {
    level = 'log',
  }: {
    level?: DebugLogLevel
  } = {}
) {
  if (envValue('NODE_ENV') === 'test') return
  if (!envBool('DEBUG')) return
  console[level](message)
}
