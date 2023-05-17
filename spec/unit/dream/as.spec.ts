import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Balloon from '../../../test-app/app/models/Balloon'
import CannotCastToNonSTIChild from '../../../src/exceptions/cannot-cast-to-non-sti-child'

describe('Dream#as', () => {
  it('recasts model as a different model', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const mylar = await Mylar.create({ user, color: 'red' })

    const balloon = await Balloon.includes('user').first()
    expect(balloon!.as(Mylar)).toMatchDreamModel(mylar)
  })

  context('with a non-sti model', () => {
    it('raises a targeted exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })

      const balloon = await Balloon.includes('user').first()
      expect(() => balloon!.as(User)).toThrowError(CannotCastToNonSTIChild)
    })
  })
})
