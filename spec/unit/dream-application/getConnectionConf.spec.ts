import { cacheDreamApplication } from '../../../src/dream-application/cache.js'
import DreamApplication, { SingleDbCredential } from '../../../src/dream-application/index.js'
import { DbConnectionType } from '../../../src/types/db.js'

describe('DreamApplication#getConnectionConf', () => {
  const updateDbCredentials = () => {
    const dreamApp = DreamApplication.getOrFail()
    dreamApp.set('db', {
      primary: primaryConfig,
      replica: replicaConfig,
    })
    cacheDreamApplication(dreamApp)
    return dreamApp
  }

  let connection: DbConnectionType
  let primaryConfig: SingleDbCredential
  let replicaConfig: SingleDbCredential | undefined

  beforeEach(() => {
    connection = 'primary'
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
    return DreamApplication.getOrFail().dbConnectionConfig(connection)
  }

  context('with no connection passed', () => {
    it('returns config for primary connection', () => {
      expect(subject()).toEqual({
        name: 'DB_NAME',
        host: 'DB_HOST',
        port: 3333,
        password: 'DB_PASSWORD',
        user: 'DB_USER',
        useSsl: false,
      })
    })
  })

  context('with primary connection passed', () => {
    beforeEach(() => {
      connection = 'primary'
    })

    it('returns config for primary connection', () => {
      expect(subject()).toEqual({
        name: 'DB_NAME',
        host: 'DB_HOST',
        port: 3333,
        password: 'DB_PASSWORD',
        user: 'DB_USER',
        useSsl: false,
      })
    })
  })

  context('with replica connection passed', () => {
    beforeEach(() => {
      connection = 'replica'
    })

    it('returns config for replica connection', () => {
      expect(subject()).toEqual({
        name: 'DB_REPLICA_NAME',
        host: 'DB_REPLICA_HOST',
        port: 4444,
        password: 'DB_REPLICA_PASSWORD',
        user: 'DB_REPLICA_USER',
        useSsl: true,
      })
    })

    context('with no replica config set', () => {
      beforeEach(() => {
        replicaConfig = undefined
      })

      it('returns primary replica', () => {
        expect(subject()).toEqual({
          name: 'DB_NAME',
          host: 'DB_HOST',
          port: 3333,
          password: 'DB_PASSWORD',
          user: 'DB_USER',
          useSsl: false,
        })
      })
    })
  })
})
