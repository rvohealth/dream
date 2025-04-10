import { cacheDreamApplication } from '../../../src/dream-application/cache.js'
import DreamApplication, { SingleDbCredential } from '../../../src/dream-application/index.js'

describe('DreamApplication#hasReplicaConfig', () => {
  const updateDbCredentials = () => {
    const dreamApp = DreamApplication.getOrFail()
    dreamApp.set('db', {
      primary: primaryConfig,
      replica: replicaConfig,
    })
    cacheDreamApplication(dreamApp)
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
    return DreamApplication.getOrFail().hasReplicaConfig
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
