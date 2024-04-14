export type DebugLogLevel = 'log' | 'warn' | 'error'

export default function debug(
  message: string,
  {
    level = 'log',
  }: {
    level?: DebugLogLevel
  } = {}
) {
  if (process.env.NODE_ENV === 'test') return
  if (process.env.DEBUG !== '1') return
  console[level](message)
}
