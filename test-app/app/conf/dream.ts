import path from 'path'
import { DreamApplication } from '../../../src'
import inflections from './inflections'

export default async function dreamApplicationOpts(dreamApp: DreamApplication) {
  // sets the root directory for the dream application
  dreamApp.set('appRoot', path.join(__dirname, '..', '..'))

  // sets the primary key type to use when generating new models for your app
  dreamApp.set('primaryKeyType', 'bigserial')

  // sends all the models in your app into the DreamApplication instance
  dreamApp.set('models', await DreamApplication.loadModels(path.join(__dirname, '..', 'models')))

  // sends all the view models in your app into the DreamApplication instance
  dreamApp.set('viewModels', await DreamApplication.loadViewModels(path.join(__dirname, '..', 'view-models')))

  // sends all the serializers in your app into the DreamApplication instance
  dreamApp.set(
    'serializers',
    await DreamApplication.loadSerializers(path.join(__dirname, '..', 'serializers'))
  )

  // sends all the services in your app into the DreamApplication instance
  dreamApp.set('services', await DreamApplication.loadServices(path.join(__dirname, '..', 'services')))

  // provides a callback function which configures inflections for your application
  dreamApp.set('inflections', inflections)

  // provides a list of path overrides for your app. This is optional, and will default
  // to the paths expected for a typical psychic application.
  dreamApp.set('paths', {
    models: 'test-app/app/models',
    serializers: 'test-app/app/serializers',
    conf: 'test-app/app/conf',
    db: 'test-app/db',
    uspecs: 'test-app/spec/unit',
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
