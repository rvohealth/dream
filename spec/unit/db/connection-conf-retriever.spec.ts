import ConnectionConfRetriever from '../../../src/db/connection-conf-retriever'
import { DbConnectionType } from '../../../src/db/types'
import { DbConnectionConfig } from '../../../src/helpers/path/types'
import Dreamconf from '../../../src/helpers/dreamconf'

describe('ConnectionConfRetriever', () => {
  const getConfig = () =>
    new Dreamconf({
      DB: {},
      schema: {},
      env: {
        db: {
          production: {
            primary: prodPrimaryConfig,
            replica: prodReplicaConfig,
          },
          development: {
            primary: devPrimaryConfig,
            replica: devReplicaConfig,
          },
          test: {
            primary: testPrimaryConfig,
            replica: testReplicaConfig,
          },
        },
      },
    })

  let connection: DbConnectionType
  let prodPrimaryConfig: DbConnectionConfig
  let prodReplicaConfig: DbConnectionConfig | undefined
  let devPrimaryConfig: DbConnectionConfig
  let devReplicaConfig: DbConnectionConfig | undefined
  let testPrimaryConfig: DbConnectionConfig
  let testReplicaConfig: DbConnectionConfig | undefined

  beforeEach(() => {
    connection = 'primary'
    prodPrimaryConfig = {
      name: 'PRODUCTION_NAME',
      host: 'PRODUCTION_HOST',
      port: 'PRODUCTION_PORT',
      password: 'PRODUCTION_PASSWORD',
      user: 'PRODUCTION_USER',
      use_ssl: 'PRODUCTION_USE_SSL',
    }
    prodReplicaConfig = {
      name: 'PRODUCTION_REPLICA_NAME',
      host: 'PRODUCTION_REPLICA_HOST',
      port: 'PRODUCTION_REPLICA_PORT',
      password: 'PRODUCTION_REPLICA_PASSWORD',
      user: 'PRODUCTION_REPLICA_USER',
      use_ssl: 'PRODUCTION_REPLICA_USE_SSL',
    }
    devPrimaryConfig = {
      name: 'DEVELOPMENT_NAME',
      host: 'DEVELOPMENT_HOST',
      port: 'DEVELOPMENT_PORT',
      password: 'DEVELOPMENT_PASSWORD',
      user: 'DEVELOPMENT_USER',
      use_ssl: 'DEVELOPMENT_USE_SSL',
    }
    devReplicaConfig = {
      name: 'DEVELOPMENT_REPLICA_NAME',
      host: 'DEVELOPMENT_REPLICA_HOST',
      port: 'DEVELOPMENT_REPLICA_PORT',
      password: 'DEVELOPMENT_REPLICA_PASSWORD',
      user: 'DEVELOPMENT_REPLICA_USER',
      use_ssl: 'DEVELOPMENT_REPLICA_USE_SSL',
    }
    testPrimaryConfig = {
      name: 'TEST_NAME',
      host: 'TEST_HOST',
      port: 'TEST_PORT',
      password: 'TEST_PASSWORD',
      user: 'TEST_USER',
      use_ssl: 'TEST_USE_SSL',
    }
    testReplicaConfig = {
      name: 'TEST_REPLICA_NAME',
      host: 'TEST_REPLICA_HOST',
      port: 'TEST_REPLICA_PORT',
      password: 'TEST_REPLICA_PASSWORD',
      user: 'TEST_REPLICA_USER',
      use_ssl: 'TEST_REPLICA_USE_SSL',
    }
  })

  describe('#getConnectionConf', () => {
    const subject = () => {
      const connectionRetriever = new ConnectionConfRetriever(getConfig())
      return connectionRetriever.getConnectionConf(connection)
    }

    context('with no connection passed', () => {
      it('returns config for primary connection', () => {
        expect(subject()).toEqual({
          name: 'TEST_NAME',
          host: 'TEST_HOST',
          port: 'TEST_PORT',
          password: 'TEST_PASSWORD',
          user: 'TEST_USER',
          use_ssl: 'TEST_USE_SSL',
        })
      })
    })

    context('with primary connection passed', () => {
      beforeEach(() => {
        connection = 'primary'
      })

      it('returns config for primary connection', () => {
        expect(subject()).toEqual({
          name: 'TEST_NAME',
          host: 'TEST_HOST',
          port: 'TEST_PORT',
          password: 'TEST_PASSWORD',
          user: 'TEST_USER',
          use_ssl: 'TEST_USE_SSL',
        })
      })
    })

    context('with replica connection passed', () => {
      beforeEach(() => {
        connection = 'replica'
      })

      it('returns config for replica connection', () => {
        expect(subject()).toEqual({
          name: 'TEST_REPLICA_NAME',
          host: 'TEST_REPLICA_HOST',
          port: 'TEST_REPLICA_PORT',
          password: 'TEST_REPLICA_PASSWORD',
          user: 'TEST_REPLICA_USER',
          use_ssl: 'TEST_REPLICA_USE_SSL',
        })
      })

      context('with no replica config set', () => {
        beforeEach(() => {
          testReplicaConfig = undefined
        })

        it('returns primary replica', () => {
          expect(subject()).toEqual({
            name: 'TEST_NAME',
            host: 'TEST_HOST',
            port: 'TEST_PORT',
            password: 'TEST_PASSWORD',
            user: 'TEST_USER',
            use_ssl: 'TEST_USE_SSL',
          })
        })
      })
    })

    context('with a different node env set', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production'
      })

      afterEach(() => {
        process.env.NODE_ENV = 'test'
      })

      it('returns config for the specified node env', () => {
        expect(subject()).toEqual({
          name: 'PRODUCTION_NAME',
          host: 'PRODUCTION_HOST',
          port: 'PRODUCTION_PORT',
          password: 'PRODUCTION_PASSWORD',
          user: 'PRODUCTION_USER',
          use_ssl: 'PRODUCTION_USE_SSL',
        })
      })
    })
  })

  describe('#hasReplicaConfig', () => {
    const subject = () => {
      const connectionRetriever = new ConnectionConfRetriever(getConfig())
      return connectionRetriever.hasReplicaConfig()
    }

    context('when replica config is present', () => {
      it('returns false', () => {
        expect(subject()).toEqual(true)
      })
    })

    context('when replica config is not present', () => {
      beforeEach(() => {
        testReplicaConfig = undefined
      })

      it('returns false', () => {
        expect(subject()).toEqual(false)
      })
    })
  })
})
