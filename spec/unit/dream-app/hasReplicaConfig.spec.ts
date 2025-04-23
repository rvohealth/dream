import { cacheDreamApp } from '../../../src/dream-app/cache.js'
import DreamApp, { SingleDbCredential } from '../../../src/dream-app/index.js'

describe('DreamApp#hasReplicaConfig', () => {
  const updateDbCredentials = () => {
    const dreamApp = DreamApp.getOrFail()
    dreamApp.set('db', {
      primary: primaryConfig,
      replica: replicaConfig,
    })
    cacheDreamApp(dreamApp)
    return dreamApp
  }

  let primaryConfig: SingleDbCredential
  let replicaConfig: SingleDbCredential | undefined

  beforeEach(() => {
    primaryConfig = {
      name: 'DB_NAME',
      host: 'DB_HOST',
      port: 3333,
      password: 'DB_PASSWORD',
      user: 'DB_USER',
      useSsl: false,
    }
    replicaConfig = {
      name: 'DB_REPLICA_NAME',
      host: 'DB_REPLICA_HOST',
      port: 4444,
      password: 'DB_REPLICA_PASSWORD',
      user: 'DB_REPLICA_USER',
      useSsl: true,
    }
  })

  const subject = () => {
    updateDbCredentials()
    return DreamApp.getOrFail().hasReplicaConfig
  }

  context('when replica config is present', () => {
    it('returns false', () => {
      expect(subject()).toEqual(true)
    })
  })

  context('when replica config is not present', () => {
    beforeEach(() => {
      replicaConfig = undefined
    })

    it('returns false', () => {
      expect(subject()).toEqual(false)
    })
  })
})
