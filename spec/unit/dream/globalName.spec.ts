import Dream from '../../../src/Dream.js'
import GlobalNameNotSet from '../../../src/errors/dream-app/GlobalNameNotSet.js'
import * as dreamExports from '../../../src/package-exports/index.js'
import * as errorExports from '../../../src/package-exports/errors.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.globalName', () => {
  it('returns the name the app registered for the model', () => {
    expect(User.globalName).toEqual('User')
  })

  context('when no global name has been registered', () => {
    it('throws, naming the class', () => {
      class Unregistered extends Dream {}

      expect(() => Unregistered.globalName).toThrow(GlobalNameNotSet)
      expect(() => Unregistered.globalName).toThrow('Unregistered')
    })

    it('does not expose the error for an application to catch', () => {
      // an unregistered global name is a configuration gap that fails at boot,
      // not a runtime condition an application recovers from
      expect('GlobalNameNotSet' in errorExports).toBe(false)
      expect('GlobalNameNotSet' in dreamExports).toBe(false)
    })
  })
})
