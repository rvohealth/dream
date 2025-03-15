import * as LoadModelsModule from '../../../src/dream-application/helpers/importers/importModels.js'
import DreamApplicationInitMissingCallToLoadModels from '../../../src/errors/dream-application/DreamApplicationInitMissingCallToLoadModels.js'
import DreamApplicationInitMissingMissingProjectRoot from '../../../src/errors/dream-application/DreamApplicationInitMissingMissingProjectRoot.js'
import InvalidTableName from '../../../src/errors/InvalidTableName.js'
import { DreamApplication } from '../../../src/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'

describe('DreamApplication#init', () => {
  const dbCredentials = {
    primary: {
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD!,
      host: process.env.PRIMARY_DB_HOST!,
      name: process.env.PRIMARY_DB_NAME!,
      port: parseInt(process.env.DB_PORT!),
      useSsl: process.env.DB_USE_SSL === '1',
    },
  }

  beforeEach(() => {
    vi.spyOn(LoadModelsModule, 'default').mockResolvedValue({} as any)
  })

  context('with a valid config', () => {
    it('does not raise an exception', async () => {
      const cb = async (app: DreamApplication) => {
        app.set('projectRoot', 'how/yadoin')
        app.set('db', dbCredentials)

        await app.load('models', 'how/yadoin', async path => (await import(path)).default)
      }

      await expect(DreamApplication.init(cb)).resolves.not.toThrow()
    })
  })

  context('with an invalid config', () => {
    context('load("models") never called', () => {
      it('throws targeted exception', async () => {
        const cb = (app: DreamApplication) => {
          app.set('projectRoot', 'how/yadoin')
          app.set('db', dbCredentials)
        }

        await expect(DreamApplication.init(cb)).rejects.toThrow(DreamApplicationInitMissingCallToLoadModels)
      })
    })

    context('projectRoot not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: DreamApplication) => {
          await app.load('models', 'how/yadoin', async path => (await import(path)).default)
          app.set('db', dbCredentials)
        }

        await expect(DreamApplication.init(cb)).rejects.toThrow(DreamApplicationInitMissingMissingProjectRoot)
      })
    })

    context('model is introduced with invalid table name', () => {
      class HelloWorld extends ApplicationModel {
        public get table() {
          // intentionally invalid table name
          return 'userz'
        }
      }

      it('throws targeted exception', async () => {
        const cb = async (app: DreamApplication) => {
          app.set('projectRoot', 'how/yadoin')
          app.set('db', dbCredentials)

          await app.load('models', 'how/yadoin', async path => (await import(path)).default)
        }

        vi.spyOn(DreamApplication.prototype, 'models', 'get').mockReturnValue({
          HelloWorld,
        })

        await expect(DreamApplication.init(cb)).rejects.toThrow(InvalidTableName)
      })
    })
  })
})
