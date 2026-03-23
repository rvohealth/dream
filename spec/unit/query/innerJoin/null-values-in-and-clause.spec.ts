import Composition from '../../../../test-app/app/models/Composition.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#innerJoin with null values in and-clause', () => {
  // Regression test: Object.getPrototypeOf(null) in removeJoinAndFromObjectHierarchy
  // would throw "TypeError: Cannot convert undefined or null to object" when null
  // values appeared anywhere in the joinAndStatements hierarchy (e.g. when using
  // preload with andNot: { someField: null } or innerJoin with and: { someField: null }).

  context('when the and-clause contains a null value', () => {
    it('does not throw a TypeError when building the similarity statement', async () => {
      await User.create({ email: 'fred@fishman', password: 'howyadoin' })

      // This should not throw "TypeError: Cannot convert undefined or null to object"
      // which was caused by Object.getPrototypeOf(null) in removeJoinAndFromObjectHierarchy
      await expect(User.innerJoin('compositions', { and: { content: null } }).all()).resolves.not.toThrow()
    })
  })

  context('when the andNot-clause contains a null value', () => {
    it('does not throw a TypeError when building the similarity statement', async () => {
      const user = await User.create({ email: 'fred@fishman', password: 'howyadoin' })
      await Composition.create({ userId: user.id, content: 'some content' })

      // This should not throw "TypeError: Cannot convert undefined or null to object"
      // which was caused by Object.getPrototypeOf(null) in removeJoinAndFromObjectHierarchy
      const results = await User.innerJoin('compositions', { andNot: { content: null } }).all()
      expect(results).toMatchDreamModels([user])
    })
  })
})
