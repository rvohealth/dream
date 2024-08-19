import { describe as context } from '@jest/globals'
import { DreamApplication } from '../../../src'
import * as LoadModelsModule from '../../../src/dream-application/helpers/loadModels'

describe('DreamApplication#init', () => {
  beforeEach(() => {
    jest.spyOn(LoadModelsModule, 'default').mockResolvedValue({} as any)
  })

  context('with a valid config', () => {
    it('does not raise an exception', async () => {
      const cb = async (app: DreamApplication) => {
        app.set('appRoot', 'how/yadoin')
        await app.load('models', 'how/yadoin')
      }

      await expect(DreamApplication.init(cb)).resolves.not.toThrow()
    })
  })

  context('with an invalid config', () => {
    context('load("models") never called', () => {
      it('throws targeted exception', async () => {
        const cb = (app: DreamApplication) => {
          app.set('appRoot', 'how/yadoin')
        }

        await expect(DreamApplication.init(cb)).rejects.toThrow()
      })
    })

    context('appRoot not set', () => {
      it('throws targeted exception', async () => {
        const cb = async (app: DreamApplication) => {
          await app.load('models', 'how/yadoin')
        }

        await expect(DreamApplication.init(cb)).rejects.toThrow()
      })
    })
  })
})
