import Env from '../../../src/helpers/Env.js'

class AppEnvClass extends Env<{
  boolean: 'CONSOLE_SERVICE' | 'CLIENT' | 'DB_NO_SSL' | 'REQUEST_LOGGING' | 'WEB_SERVICE' | 'WORKER_SERVICE'

  integer:
    | 'BG_JOBS_REDIS_PORT'
    | 'DB_PORT'
    | 'DB_PORT_2'
    | 'DB_PORT_MYSQL'
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
    | 'DB_HOST_MYSQL'
    | 'DB_NAME'
    | 'DB_NAME_2'
    | 'DB_NAME_MYSQL'
    | 'DB_PASSWORD'
    | 'DB_PASSWORD_MYSQL'
    | 'DB_USER'
    | 'DB_USER_MYSQL'
    | 'REPLICA_DB_HOST'
    | 'SSL_CERT_PATH'
    | 'SSL_KEY_PATH'
    | 'WS_REDIS_HOST'
    | 'WS_REDIS_PASSWORD'
    | 'WS_REDIS_USERNAME'
}> {}

const AppEnv = new AppEnvClass()
export default AppEnv
