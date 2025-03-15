import Env from './Env.js.js'

const EnvInternal = new Env<{
  string: 'DREAM_CORE_DEVELOPMENT' | 'TZ'
  boolean:
    | 'ALLOW_BENCHMARKS'
    | 'DEBUG'
    | 'DREAM_CORE_DEVELOPMENT'
    | 'DREAM_CORE_SPEC_RUN'
    | 'PSYCHIC_CORE_DEVELOPMENT'
    | 'BYPASS_DB_CONNECTIONS_DURING_INIT'
}>()

export default EnvInternal
