import { Kysely } from 'kysely'
import {
  closeAllConnectionsForConnectionName,
  dreamDbConnections,
} from '../../../src/db/DreamDbConnection.js'
import DreamApp from '../../../src/dream-app/index.js'

describe('closeAllConnectionsForConnectionName', () => {
  const fakeConnectionName = 'fakeConnectionForDestroySpecs'

  afterEach(() => {
    delete dreamDbConnections()[fakeConnectionName]
  })

  context('when destroying a connection rejects', () => {
    it('logs the rejection instead of silently swallowing it', async () => {
      const logSpy = vi.spyOn(DreamApp, 'logWithLevel').mockImplementation(() => {})
      const error = new Error('destroy failure')

      dreamDbConnections()[fakeConnectionName] = {
        primary: { destroy: () => Promise.reject(error) } as unknown as Kysely<any>,
      }

      await closeAllConnectionsForConnectionName(fakeConnectionName)

      expect(logSpy).toHaveBeenCalledWith(
        'error',
        expect.stringContaining(`${fakeConnectionName}:primary`),
        error
      )
    })

    it('still destroys the other connections for the connection name', async () => {
      vi.spyOn(DreamApp, 'logWithLevel').mockImplementation(() => {})
      const destroySpy = vi.fn(() => Promise.resolve())

      dreamDbConnections()[fakeConnectionName] = {
        primary: { destroy: () => Promise.reject(new Error('destroy failure')) } as unknown as Kysely<any>,
        replica: { destroy: destroySpy } as unknown as Kysely<any>,
      }

      await closeAllConnectionsForConnectionName(fakeConnectionName)

      expect(destroySpy).toHaveBeenCalledOnce()
      expect(dreamDbConnections()[fakeConnectionName]).toEqual({})
    })
  })

  context('when destroying connections succeeds', () => {
    it('does not log', async () => {
      const logSpy = vi.spyOn(DreamApp, 'logWithLevel').mockImplementation(() => {})

      dreamDbConnections()[fakeConnectionName] = {
        primary: { destroy: () => Promise.resolve() } as unknown as Kysely<any>,
      }

      await closeAllConnectionsForConnectionName(fakeConnectionName)

      expect(logSpy).not.toHaveBeenCalled()
    })
  })
})
