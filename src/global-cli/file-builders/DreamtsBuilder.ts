import { InitDreamAppCliOptions } from '../helpers/primaryKeyTypes'

export default class DreamtsBuilder {
  public static build(options: InitDreamAppCliOptions) {
    const {
      configPath,
      dbPath,
      typesPath,
      factoriesPath,
      modelsPath,
      serializersPath,
      servicesPath,
      modelSpecsPath,
      primaryKeyType,
    } = options

    return `\
import * as path from 'path'
import { DreamApplication } from '@rvohealth/dream'
import inflections from './inflections'

export default async function (app: DreamApplication) {
  await app.load('models', path.join(__dirname, '..', 'models'))
  await app.load('serializers', path.join(__dirname, '..', 'serializers'))
  await app.load('services', path.join(__dirname, '..', 'services'))

  app.set('projectRoot', path.join(__dirname, '..', '..', '..'))
  app.set('primaryKeyType', '${primaryKeyType}')
  app.set('inflections', inflections)

  // app.set(
  //   'logger',
  //   winston.createLogger({
  //     level: 'info',
  //     format: winston.format.json(),
  //     defaultMeta: { service: 'user-service' },
  //     transports: [
  //       new winston.transports.File({ filename: 'error.log', level: 'error' }),
  //       new winston.transports.File({ filename: 'combined.log' }),
  //     ],
  //   })
  // )

  // provides a list of path overrides for your app. This is optional, and will default
  // to the paths expected for a typical psychic application.
  app.set('paths', {
    conf: '${configPath}',
    db: '${dbPath}',
    types: '${typesPath}',
    factories: '${factoriesPath}',
    models: '${modelsPath}',
    serializers: '${serializersPath}',
    services: '${servicesPath}',
    modelSpecs: '${modelSpecsPath}',
  })

  // provides db credentials and configuration for your app.
  app.set('db', {
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
`
  }
}
