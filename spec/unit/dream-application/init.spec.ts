import { describe as context } from '@jest/globals'
import { DreamApplication } from '../../../src'
import * as LoadModelsModule from '../../../src/dream-application/helpers/loadModels'
import DreamApplicationInitMissingCallToLoadModels from '../../../src/errors/dream-application/DreamApplicationInitMissingCallToLoadModels'
import DreamApplicationInitMissingMissingProjectRoot from '../../../src/errors/dream-application/DreamApplicationInitMissingMissingProjectRoot'

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
    jest.spyOn(LoadModelsModule, 'default').mockResolvedValue({} as any)
  })

  context('with a valid config', () => {
    it('does not raise an exception', async () => {
      const cb = async (app: DreamApplication) => {
        app.set('projectRoot', 'how/yadoin')
        app.set('db', dbCredentials)

        await app.load('models', 'how/yadoin')
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
          await app.load('models', 'how/yadoin')
          app.set('db', dbCredentials)
        }

        await expect(DreamApplication.init(cb)).rejects.toThrow(DreamApplicationInitMissingMissingProjectRoot)
      })
    })
  })
})
