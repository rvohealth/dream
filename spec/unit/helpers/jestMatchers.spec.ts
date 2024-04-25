import User from '../../../test-app/app/models/User'
import Balloon from '../../../test-app/app/models/Balloon'

describe('jestMatchers', () => {
  describe('toMatchDreamModel', () => {
    let user: User
    let balloon: Balloon

    beforeEach(async () => {
      user = await User.create({ email: 'trace@was', password: 'here' })
      balloon = await Balloon.create({ type: 'Animal' })
    })

    it('can match with asymmetrical matchers', () => {
      const mock = jest.fn()
      mock(user)

      expect(mock).toHaveBeenCalledWith(expect.toMatchDreamModel(user))
      expect(mock).not.toHaveBeenCalledWith(expect.toMatchDreamModel(balloon))
    })

    it('can be used with toHaveBeenCalledWith multiple times', () => {
      const mock = jest.fn()
      mock(user, balloon)

      expect(mock).toHaveBeenCalledWith(expect.toMatchDreamModel(user), expect.toMatchDreamModel(balloon))
      expect(mock).not.toHaveBeenCalledWith(expect.toMatchDreamModel(balloon), expect.toMatchDreamModel(user))
    })
  })
})
