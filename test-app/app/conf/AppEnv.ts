import { Env } from '../../../src/index.js'

class AppEnvClass extends Env<{
  boolean: 'CONSOLE_SERVICE' | 'CLIENT' | 'DB_NO_SSL' | 'REQUEST_LOGGING' | 'WEB_SERVICE' | 'WORKER_SERVICE'

  integer:
    | 'BG_JOBS_REDIS_PORT'
    | 'DB_PORT'
    | 'DB_PORT_2'
    | 'DREAM_PARALLEL_TESTS'
    | 'REPLICA_DB_PORT'
    | 'WS_REDIS_PORT'

  string:
    | 'APP_ENCRYPTION_KEY'
    | 'BG_JOBS_REDIS_HOST'
    | 'BG_JOBS_REDIS_PASSWORD'
    | 'BG_JOBS_REDIS_USERNAME'
    | 'CORS_HOSTS'
    | 'DB_HOST'
    | 'DB_NAME'
    | 'DB_NAME_2'
    | 'DB_PASSWORD'
    | 'DB_USER'
    | 'REPLICA_DB_HOST'
    | 'SSL_CERT_PATH'
    | 'SSL_KEY_PATH'
    | 'WS_REDIS_HOST'
    | 'WS_REDIS_PASSWORD'
    | 'WS_REDIS_USERNAME'
}> {}

const AppEnv = new AppEnvClass()
export default AppEnv
