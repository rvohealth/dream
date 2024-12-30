import EnvInternal from './EnvInternal'

export type DebugLogLevel = 'log' | 'warn' | 'error'

export default function debug(
  message: string,
  {
    level = 'log',
  }: {
    level?: DebugLogLevel
  } = {}
) {
  if (EnvInternal.isTest) return
  if (!EnvInternal.isDebug) return
  console[level](message)
}
