export function envValue(env: AllowedEnv) {
  return process.env[env]!
}

export function envInt(env: AllowedEnv): number | null {
  const val = envValue(env)
  if (typeof parseInt(val) === 'number') return parseInt(val)
  return null
}

export function envBool(env: AllowedBoolEnv) {
  return process.env[env] === '1'
}

export type AllowedEnv = 'NODE_ENV' | 'DREAM_CORE_DEVELOPMENT' | 'TZ'

export type AllowedBoolEnv =
  | 'ALLOW_BENCHMARKS'
  | 'DEBUG'
  | 'DREAM_CORE_DEVELOPMENT'
  | 'DREAM_CORE_SPEC_RUN'
  | 'PSYCHIC_CORE_DEVELOPMENT'
