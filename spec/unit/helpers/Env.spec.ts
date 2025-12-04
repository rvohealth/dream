import MissingRequiredEnvironmentVariable from '../../../src/errors/environment/MissingRequiredEnvironmentVariable.js'
import Env from '../../../src/helpers/Env.js'

describe('Env', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const TestEnv = new Env<{
    string: 'ENV_STRING_TEST'
    integer: 'ENV_INTEGER_TEST'
    boolean: 'ENV_BOOLEAN_TEST'
  }>()

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    originalNodeEnv === undefined ? delete process.env.NODE_ENV : (process.env.NODE_ENV = originalNodeEnv)
  })

  describe('#isProduction', () => {
    context('when NODE_ENV is "production"', () => {
      it('is true', () => {
        process.env.NODE_ENV = 'production'
        expect(TestEnv.isProduction).toBe(true)
      })
    })

    context('when NODE_ENV is "development"', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'development'
        expect(TestEnv.isProduction).toBe(false)
      })
    })

    context('when NODE_ENV is "test"', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'test'
        expect(TestEnv.isProduction).toBe(false)
      })
    })

    context('when NODE_ENV is not a recognized environment', () => {
      it('is true', () => {
        process.env.NODE_ENV = 'staging'
        expect(TestEnv.isProduction).toBe(true)
      })
    })

    context('when NODE_ENV is undefined', () => {
      it('is true', () => {
        delete process.env.NODE_ENV
        expect(TestEnv.isProduction).toBe(true)
      })
    })
  })

  describe('#nodeEnv', () => {
    context('when NODE_ENV is "production"', () => {
      it('is "production"', () => {
        process.env.NODE_ENV = 'production'
        expect(TestEnv.nodeEnv).toEqual('production')
      })
    })

    context('when NODE_ENV is "test"', () => {
      it('is "test"', () => {
        process.env.NODE_ENV = 'test'
        expect(TestEnv.nodeEnv).toEqual('test')
      })
    })

    context('when NODE_ENV is "development"', () => {
      it('is "development"', () => {
        process.env.NODE_ENV = 'development'
        expect(TestEnv.nodeEnv).toEqual('development')
      })
    })

    context('when NODE_ENV is not a recognized environment', () => {
      it('is "production"', () => {
        process.env.NODE_ENV = 'staging'
        expect(TestEnv.nodeEnv).toEqual('production')
      })
    })

    context('when NODE_ENV is undefined', () => {
      it('is "production"', () => {
        delete process.env.NODE_ENV
        expect(TestEnv.nodeEnv).toEqual('production')
      })
    })
  })

  describe('#isTest', () => {
    context('when NODE_ENV is "production"', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'production'
        expect(TestEnv.isTest).toBe(false)
      })
    })

    context('when NODE_ENV is "development"', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'development'
        expect(TestEnv.isTest).toBe(false)
      })
    })

    context('when NODE_ENV is "test"', () => {
      it('is true', () => {
        process.env.NODE_ENV = 'test'
        expect(TestEnv.isTest).toBe(true)
      })
    })

    context('when NODE_ENV is not a recognized environment', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'staging'
        expect(TestEnv.isTest).toBe(false)
      })
    })

    context('when NODE_ENV is undefined', () => {
      it('is false', () => {
        delete process.env.NODE_ENV
        expect(TestEnv.isTest).toBe(false)
      })
    })
  })

  describe('#isDevelopment', () => {
    context('when NODE_ENV is "production"', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'production'
        expect(TestEnv.isDevelopment).toBe(false)
      })
    })

    context('when NODE_ENV is "development"', () => {
      it('is true', () => {
        process.env.NODE_ENV = 'development'
        expect(TestEnv.isDevelopment).toBe(true)
      })
    })

    context('when NODE_ENV is "test"', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'test'
        expect(TestEnv.isDevelopment).toBe(false)
      })
    })

    context('when NODE_ENV is not a recognized environment', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'staging'
        expect(TestEnv.isDevelopment).toBe(false)
      })
    })

    context('when NODE_ENV is undefined', () => {
      it('is false', () => {
        delete process.env.NODE_ENV
        expect(TestEnv.isDevelopment).toBe(false)
      })
    })
  })

  describe('#isDevelopmentOrTest', () => {
    context('when NODE_ENV is "production"', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'production'
        expect(TestEnv.isDevelopmentOrTest).toBe(false)
      })
    })

    context('when NODE_ENV is "development"', () => {
      it('is true', () => {
        process.env.NODE_ENV = 'development'
        expect(TestEnv.isDevelopmentOrTest).toBe(true)
      })
    })

    context('when NODE_ENV is "test"', () => {
      it('is true', () => {
        process.env.NODE_ENV = 'test'
        expect(TestEnv.isDevelopmentOrTest).toBe(true)
      })
    })

    context('when NODE_ENV is not a recognized environment', () => {
      it('is false', () => {
        process.env.NODE_ENV = 'staging'
        expect(TestEnv.isDevelopmentOrTest).toBe(false)
      })
    })

    context('when NODE_ENV is undefined', () => {
      it('is false', () => {
        delete process.env.NODE_ENV
        expect(TestEnv.isDevelopmentOrTest).toBe(false)
      })
    })
  })

  describe('#string', () => {
    it('returns the value of the specified environment variable', () => {
      process.env.ENV_STRING_TEST = 'hello world'
      expect(TestEnv.string('ENV_STRING_TEST')).toEqual('hello world')
    })

    context('when the specified environment variable is undefined', () => {
      it('throws MissingRequiredEnvironmentVariable', () => {
        delete process.env.ENV_STRING_TEST
        expect(() => TestEnv.string('ENV_STRING_TEST')).toThrow(MissingRequiredEnvironmentVariable)
      })
    })

    context('when optional is true', () => {
      context('when the specified environment variable is undefined', () => {
        it('is undefined', () => {
          delete process.env.ENV_STRING_TEST
          expect(TestEnv.string('ENV_STRING_TEST', { optional: true })).toBeUndefined()
        })
      })
    })
  })

  describe('#integer', () => {
    context('when the environment variable is a string representation of an integer', () => {
      it('returns the integer value of the specified environment variable', () => {
        process.env.ENV_INTEGER_TEST = '7'
        expect(TestEnv.integer('ENV_INTEGER_TEST')).toEqual(7)
      })
    })

    context('when the environment variable is a string representation of a decimal', () => {
      it('returns undefined', () => {
        process.env.ENV_INTEGER_TEST = '3.5'
        expect(TestEnv.integer('ENV_INTEGER_TEST')).toBeUndefined()
      })
    })

    context('when the environment variable is a string that doesn’t correspond to a number', () => {
      it('returns undefined', () => {
        process.env.ENV_INTEGER_TEST = 'hello world'
        expect(TestEnv.integer('ENV_INTEGER_TEST')).toBeUndefined()
      })
    })

    context('when the specified environment variable is undefined', () => {
      it('throws MissingRequiredEnvironmentVariable', () => {
        delete process.env.ENV_INTEGER_TEST
        expect(() => TestEnv.integer('ENV_INTEGER_TEST')).toThrow(MissingRequiredEnvironmentVariable)
      })
    })

    context('when optional is true', () => {
      context('when the specified environment variable is undefined', () => {
        it('is undefined', () => {
          delete process.env.ENV_INTEGER_TEST
          expect(TestEnv.integer('ENV_INTEGER_TEST', { optional: true })).toBeUndefined()
        })
      })
    })
  })

  describe('#boolean', () => {
    context('when the specified environment variable is "1"', () => {
      it('is true', () => {
        process.env.ENV_BOOLEAN_TEST = '1'
        expect(TestEnv.boolean('ENV_BOOLEAN_TEST')).toBe(true)
      })
    })

    context('when the specified environment variable is "0"', () => {
      it('is true', () => {
        process.env.ENV_BOOLEAN_TEST = '0'
        expect(TestEnv.boolean('ENV_BOOLEAN_TEST')).toBe(false)
      })
    })

    context('when the specified environment variable is undefined', () => {
      it('is true', () => {
        delete process.env.ENV_BOOLEAN_TEST
        expect(TestEnv.boolean('ENV_BOOLEAN_TEST')).toBe(false)
      })
    })
  })

  describe('#setBoolean', () => {
    it('sets the specified environment variable to "1"', () => {
      process.env.ENV_BOOLEAN_TEST = '0'
      TestEnv.setBoolean('ENV_BOOLEAN_TEST')
      expect(process.env.ENV_BOOLEAN_TEST).toEqual('1')
    })
  })

  describe('#unsetBoolean', () => {
    it('sets the specified environment variable to undefined', () => {
      process.env.ENV_BOOLEAN_TEST = '1'
      TestEnv.unsetBoolean('ENV_BOOLEAN_TEST')
      expect(process.env.ENV_BOOLEAN_TEST).toBeUndefined()
    })

    context('when passing undefined as the name of the environment variable', () => {
      it('leaves other environment variables unaffected', () => {
        process.env.ENV_BOOLEAN_TEST = '1'
        TestEnv.unsetBoolean(undefined as any)
        expect(process.env.ENV_BOOLEAN_TEST).toEqual('1')
      })
    })
  })

  describe('#setString', () => {
    it('sets the specified environment variable to the specified string', () => {
      process.env.ENV_STRING_TEST = 'hello world'
      TestEnv.setString('ENV_STRING_TEST', 'goodbye')
      expect(process.env.ENV_STRING_TEST).toEqual('goodbye')
    })

    context('setting to undefined', () => {
      it('sets the specified environment variable to undefined', () => {
        process.env.ENV_STRING_TEST = 'hello world'
        TestEnv.setString('ENV_STRING_TEST', undefined)
        expect(process.env.ENV_STRING_TEST).toBeUndefined()
      })
    })
  })

  describe('#unsetString', () => {
    it('sets the specified environment variable to undefined', () => {
      process.env.ENV_STRING_TEST = 'hello world'
      TestEnv.unsetString('ENV_STRING_TEST')
      expect(process.env.ENV_STRING_TEST).toBeUndefined()
    })

    context('when passing undefined as the name of the environment variable', () => {
      it('leaves other environment variables unaffected', () => {
        process.env.ENV_STRING_TEST = 'hello world'
        TestEnv.unsetString(undefined as any)
        expect(process.env.ENV_STRING_TEST).toEqual('hello world')
      })
    })
  })

  describe('#setInteger', () => {
    it('sets the specified environment variable to the specified string', () => {
      process.env.ENV_INTEGER_TEST = '3'
      TestEnv.setInteger('ENV_INTEGER_TEST', 7)
      expect(process.env.ENV_INTEGER_TEST).toEqual('7')
    })

    context('setting to a decimal', () => {
      it('sets the specified environment variable to the integer portion of the number', () => {
        process.env.ENV_INTEGER_TEST = '3'
        TestEnv.setInteger('ENV_INTEGER_TEST', 7.5)
        expect(process.env.ENV_INTEGER_TEST).toEqual('7')
      })
    })

    context('setting to undefined', () => {
      it('sets the specified environment variable to undefined', () => {
        process.env.ENV_INTEGER_TEST = '3'
        TestEnv.setInteger('ENV_INTEGER_TEST', undefined)
        expect(process.env.ENV_INTEGER_TEST).toBeUndefined()
      })
    })
  })

  describe('#unsetInteger', () => {
    it('sets the specified environment variable to undefined', () => {
      process.env.ENV_INTEGER_TEST = '3'
      TestEnv.unsetInteger('ENV_INTEGER_TEST')
      expect(process.env.ENV_INTEGER_TEST).toBeUndefined()
    })

    context('when passing undefined as the name of the environment variable', () => {
      it('leaves other environment variables unaffected', () => {
        process.env.ENV_INTEGER_TEST = '3'
        TestEnv.unsetInteger(undefined as any)
        expect(process.env.ENV_INTEGER_TEST).toEqual('3')
      })
    })
  })
})
