import * as LoadModelsModule from '../../../src/dream-app/helpers/importers/importModels.js'
import DreamApp from '../../../src/dream-app/index.js'
import DreamAppInitMissingCallToLoadModels from '../../../src/errors/dream-app/DreamAppInitMissingCallToLoadModels.js'
import DreamAppInitMissingMissingProjectRoot from '../../../src/errors/dream-app/DreamAppInitMissingMissingProjectRoot.js'
import InvalidTableName from '../../../src/errors/InvalidTableName.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'

describe('DreamApp#init', () => {
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

  context('with a valid config', () => {
    it('does not raise an exception', async () => {
      const cb = async (app: DreamApp) => {
        app.set('projectRoot', 'how/yadoin')
        app.set('db', dbCredentials)

        await app.load('models', 'how/yadoin', async path => (await import(path)).default)
      }

      await expect(DreamApp.init(cb)).resolves.not.toThrow()
    })
  })

  context('with an invalid config', () => {
    context('load("models") never called', () => {
      it('throws targeted exception', async () => {
        const cb = (app: DreamApp) => {
          app.set('projectRoot', 'how/yadoin')
          app.set('db', dbCredentials)
        }

        await expect(DreamApp.init(cb)).rejects.toThrow(DreamAppInitMissingCallToLoadModels)
      })
    })

    context('projectRoot not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: DreamApp) => {
          await app.load('models', 'how/yadoin', async path => (await import(path)).default)
          app.set('db', dbCredentials)
        }

        await expect(DreamApp.init(cb)).rejects.toThrow(DreamAppInitMissingMissingProjectRoot)
      })
    })

    context('model is introduced with invalid table name', () => {
      class HelloWorld extends ApplicationModel {
        public override get table() {
          // intentionally invalid table name
          return 'userz'
        }
      }

      it('throws targeted exception', async () => {
        const cb = async (app: DreamApp) => {
          app.set('projectRoot', 'how/yadoin')
          app.set('db', dbCredentials)

          await app.load('models', 'how/yadoin', async path => (await import(path)).default)
        }

        vi.spyOn(DreamApp.prototype, 'models', 'get').mockReturnValue({
          HelloWorld,
        })

        await expect(DreamApp.init(cb)).rejects.toThrow(InvalidTableName)
      })
    })
  })
})
