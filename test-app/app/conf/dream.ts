import path from 'path'
import { DreamApplication } from '../../../src'
import inflections from './inflections'

export default async function dreamApplicationOpts(dreamApp: DreamApplication) {
  await dreamApp.loadModels(path.join(__dirname, '..', 'models'))
  await dreamApp.loadSerializers(path.join(__dirname, '..', 'serializers'))
  await dreamApp.loadServices(path.join(__dirname, '..', 'services'))

  // sets the root directory for the dream application
  dreamApp.set('appRoot', path.join(__dirname, '..', '..'))

  // sets the primary key type to use when generating new models for your app
  dreamApp.set('primaryKeyType', 'bigserial')

  // provides a callback function which configures inflections for your application
  dreamApp.set('inflections', inflections)

  // provides a list of path overrides for your app. This is optional, and will default
  // to the paths expected for a typical psychic application.
  dreamApp.set('paths', {
    conf: 'app/conf',
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
