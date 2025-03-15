import { DreamApplication } from '../../../src/index.js'
import srcPath from '../helpers/srcPath.js'
import inflections from './inflections.js'

export default async function (dreamApp: DreamApplication) {
  await dreamApp.load('models', srcPath('app', 'models'), async path => (await import(path)).default)
  await dreamApp.load('serializers', srcPath('app', 'serializers'), async path => await import(path))
  await dreamApp.load('services', srcPath('app', 'services'), async path => (await import(path)).default)

  dreamApp.set('encryption', {
    columns: {
      current: {
        algorithm: 'aes-256-gcm',
        key: process.env.APP_ENCRYPTION_KEY!,
      },
      legacy: {
        algorithm: 'aes-256-gcm',
        key: process.env.LEGACY_APP_ENCRYPTION_KEY!,
      },
    },
  })

  dreamApp.set('projectRoot', srcPath('..'))
  dreamApp.set('primaryKeyType', 'bigserial')
  dreamApp.set('inflections', inflections)

  dreamApp.set(
    'logger',
    console
    // winston.createLogger({
    //   level: 'info',
    //   format: winston.format.json(),
    //   defaultMeta: { service: 'user-service' },
    //   transports: [
    //     //
    //     // - Write all logs with importance level of `error` or less to `error.log`
    //     // - Write all logs with importance level of `info` or less to `combined.log`
    //     //
    //     new winston.transports.File({ filename: 'error.log', level: 'error' }),
    //     new winston.transports.File({ filename: 'combined.log' }),
    //   ],
    // })
  )

  // provides a list of path overrides for your app. This is optional, and will default
  // to the paths expected for a typical psychic application.
  dreamApp.set('paths', {
    conf: 'test-app/app/conf',
    db: 'test-app/db',
    types: 'test-app/types',
    factories: 'test-app/spec/factories',
    models: 'test-app/app/models',
    serializers: 'test-app/app/serializers',
    services: 'test-app/app/services',
    modelSpecs: 'test-app/spec/unit/models',
  })

  dreamApp.set('parallelTests', Number(process.env.DREAM_PARALLEL_TESTS))

  // provides db credentials and configuration for your app.
  dreamApp.set('db', {
    primary: {
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      host: process.env.PRIMARY_DB_HOST!,
      name: process.env.PRIMARY_DB_NAME!,
      port: parseInt(process.env.DB_PORT!),
      useSsl: process.env.DB_USE_SSL === '1',
    },
    replica: {
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      host: process.env.REPLICA_DB_HOST!,
      name: process.env.REPLICA_DB_NAME!,
      port: parseInt(process.env.DB_PORT!),
      useSsl: process.env.DB_USE_SSL === '1',
    },
  })

  dreamApp.on('db:log', event => {
    __cacheMessageForTests('db:log')

    if (process.env.SQL_LOGGING !== '1') return

    if (event.level === 'error') {
      console.error('the following db query encountered an unexpected error: ', {
        durationMs: event.queryDurationMillis,
        error: event.error,
        sql: event.query.sql,
        params: event.query.parameters.map(maskPII),
      })
    } else {
      console.log('db query completed:', {
        durationMs: event.queryDurationMillis,
        sql: event.query.sql,
        params: event.query.parameters.map(maskPII),
      })
    }
  })
}

function maskPII(data: unknown) {
  return data
}

function __cacheMessageForTests(message: string) {
  process.env.__DREAM_HOOKS_TEST_CACHE ||= ''
  process.env.__DREAM_HOOKS_TEST_CACHE += `,${message}`
}
