import { DreamApp } from '../../../src/index.js'
import srcPath from '../system/srcPath.js'
import AppEnv from './AppEnv.js'
import inflections from './inflections.js'
import logger from './logger.js'

export default async function (dreamApp: DreamApp) {
  const projectRoot = srcPath('..')
  await dreamApp.load('models', srcPath('app', 'models'), async path => (await import(path)).default)
  await dreamApp.load('serializers', srcPath('app', 'serializers'), async path => await import(path))
  await dreamApp.load(
    'initializers',
    srcPath('app', 'conf', 'initializers'),
    async path => (await import(path)).default
  )

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

  dreamApp.set('projectRoot', projectRoot)
  dreamApp.set('primaryKeyType', 'bigserial')
  dreamApp.set('inflections', inflections)

  dreamApp.set('logger', logger(projectRoot))

  // provides a list of path overrides for your app. This is optional, and will default
  // to the paths expected for a typical psychic application.
  dreamApp.set('paths', {
    conf: 'test-app/app/conf',
    db: 'test-app/db',
    types: 'test-app/types',
    factories: 'test-app/spec/factories',
    models: 'test-app/app/models',
    serializers: 'test-app/app/serializers',
    modelSpecs: 'test-app/spec/unit/models',
  })

  dreamApp.set('parallelTests', Number(process.env.DREAM_PARALLEL_TESTS))

  // provides db credentials and configuration for your app.
  dreamApp.set('db', {
    primary: {
      user: AppEnv.string('DB_USER'),
      password: AppEnv.string('DB_PASSWORD', { optional: !AppEnv.isProduction }),
      host: AppEnv.string('DB_HOST', { optional: true }),
      name: AppEnv.string('DB_NAME', { optional: true }),
      port: AppEnv.integer('DB_PORT', { optional: true }),
      useSsl: false,
    },
    replica: AppEnv.string('REPLICA_DB_HOST', { optional: true })
      ? {
          user: AppEnv.string('DB_USER'),
          password: AppEnv.string('DB_PASSWORD', { optional: !AppEnv.isProduction }),
          host: AppEnv.string('REPLICA_DB_HOST', { optional: true }),
          name: AppEnv.string('DB_NAME', { optional: true }),
          port: AppEnv.integer('REPLICA_DB_PORT', { optional: true }) || AppEnv.integer('DB_PORT'),
          useSsl: false,
        }
      : undefined,
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

  dreamApp.on('repl:start', context => {
    context.__REPL_HOOK_TEST = true
  })

  dreamApp.on('cli:start', program => {
    program
      .command('cli-start-hooks:test')
      .description('this is a test of out cli:start hooks')
      .action(() => {
        console.log('cli:start hooks are working!')
        process.exit()
      })
  })
}

function maskPII(data: unknown) {
  return data
}

function __cacheMessageForTests(message: string) {
  process.env.__DREAM_HOOKS_TEST_CACHE ||= ''
  process.env.__DREAM_HOOKS_TEST_CACHE += `,${message}`
}
