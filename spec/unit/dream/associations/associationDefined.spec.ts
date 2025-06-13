import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'
import UserSettings from '../../../../test-app/app/models/UserSettings.js'

describe('Dream#associationDefined', () => {
  context('when the Dream instance has the specified association name', () => {
    it('is true', () => {
      const user = User.new()
      expect(user.associationDefined('userSettings')).toBe(true)
    })

    context('when a Dream class is provided that matches the class of the associated model', () => {
      it('is true', () => {
        const user = User.new()
        expect(user.associationDefined('userSettings', UserSettings)).toBe(true)
      })
    })

    context('when a Dream class is provided that does not match the class of the associated model', () => {
      it('is false', () => {
        const user = User.new()
        expect(user.associationDefined('userSettings', Pet)).toBe(false)
      })
    })
  })

  context('when the Dream instance does not have the specified association name', () => {
    it('is false', () => {
      const user = User.new()
      expect(user.associationDefined('userSettingzzzz')).toBe(false)
    })
  })
})
