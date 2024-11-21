import ConnectionConfRetriever from '../../../src/db/ConnectionConfRetriever'
import { DbConnectionType } from '../../../src/db/types'
import DreamApplication, { SingleDbCredential } from '../../../src/dream-application'
import { cacheDreamApplication } from '../../../src/dream-application/cache'

describe('ConnectionConfRetriever', () => {
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

  describe('#getConnectionConf', () => {
    const subject = () => {
      updateDbCredentials()
      const connectionRetriever = new ConnectionConfRetriever()
      return connectionRetriever.getConnectionConf(connection)
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

  describe('#hasReplicaConfig', () => {
    const subject = () => {
      updateDbCredentials()
      const connectionRetriever = new ConnectionConfRetriever()
      return connectionRetriever.hasReplicaConfig()
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
})
