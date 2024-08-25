import path from 'path'
import winston from 'winston'
import { DreamApplication } from '../../../src'
import inflections from './inflections'

export default async function (dreamApp: DreamApplication) {
  await dreamApp.load('models', path.join(__dirname, '..', 'models'))
  await dreamApp.load('serializers', path.join(__dirname, '..', 'serializers'))
  await dreamApp.load('services', path.join(__dirname, '..', 'services'))

  dreamApp.set('projectRoot', path.join(__dirname, '..', '..', '..'))
  dreamApp.set('primaryKeyType', 'bigserial')
  dreamApp.set('inflections', inflections)

  dreamApp.set(
    'logger',
    winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'user-service' },
      transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    })
  )

  // provides a list of path overrides for your app. This is optional, and will default
  // to the paths expected for a typical psychic application.
  dreamApp.set('paths', {
    conf: 'test-app/app/conf',
    db: 'test-app/db',
    factories: 'test-app/spec/factories',
    models: 'test-app/app/models',
    serializers: 'test-app/app/serializers',
    services: 'test-app/app/services',
    modelSpecs: 'test-app/spec/unit/models',
  })

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
}
