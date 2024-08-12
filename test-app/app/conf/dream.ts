import path from 'path'
import { DreamApplication, DreamApplicationOpts } from '../../../src'

export async function dreamApplicationOpts(): Promise<DreamApplicationOpts> {
  return {
    appRoot: path.join(__dirname, '..', '..'),
    models: await DreamApplication.loadModels(path.join(__dirname, '..', 'models')),
    viewModels: await DreamApplication.loadViewModels(path.join(__dirname, '..', 'view-models')),
    serializers: await DreamApplication.loadSerializers(path.join(__dirname, '..', 'serializers')),
    services: await DreamApplication.loadServices(path.join(__dirname, '..', 'services')),
    paths: {
      db: 'test-app/db',
    },
    primaryKeyType: 'bigserial',
    db: {
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
    },
  }
}

export async function initializeDreamApplication() {
  return DreamApplication.init(await dreamApplicationOpts())
}
