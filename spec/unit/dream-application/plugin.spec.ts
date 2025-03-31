import * as LoadModelsModule from '../../../src/dream-application/helpers/importers/importModels.js'
import { DreamApplication } from '../../../src/index.js'

describe('DreamApplication#plugin', () => {
  const dbCredentials = {
    primary: {
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      host: process.env.DB_HOST!,
      name: process.env.DB_NAME!,
      port: parseInt(process.env.DB_PORT!),
      useSsl: process.env.DB_USE_SSL === '1',
    },
  }

  beforeEach(() => {
    vi.spyOn(LoadModelsModule, 'default').mockResolvedValue({} as any)
  })

  const defaultBehavior = async (app: DreamApplication) => {
    app.set('projectRoot', 'how/yadoin')
    app.set('db', dbCredentials)
    await app.load('models', 'how/yadoin', async path => (await import(path)).default)
  }

  it('calls plugin callbacks, providing the dream application', async () => {
    let cachedApp: DreamApplication | undefined = undefined

    await DreamApplication.init(async app => {
      await defaultBehavior(app)
      app.plugin(_app => {
        cachedApp = _app
      })
    })

    expect(cachedApp! instanceof DreamApplication).toBe(true)
  })
})
