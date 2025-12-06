import * as LoadModelsModule from '../../../src/dream-app/helpers/importers/importModels.js'
import DreamApp from '../../../src/dream-app/index.js'

describe('DreamApp#plugin', () => {
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

  const defaultBehavior = async (app: DreamApp) => {
    app.set('projectRoot', 'how/yadoin')
    app.set('db', dbCredentials)
    app.set('packageManager', 'pnpm')
    await app.load('models', 'how/yadoin', async path => (await import(path)).default)
  }

  it('calls plugin callbacks, providing the dream application', async () => {
    let cachedApp: DreamApp | undefined = undefined

    await DreamApp.init(async app => {
      await defaultBehavior(app)
      app.plugin(_app => {
        cachedApp = _app
      })
    })

    expect(cachedApp! instanceof DreamApp).toBe(true)
  })
})
