import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import Mylar from '../../../test-app/app/models/Balloon/Mylar'
import Balloon from '../../../test-app/app/models/Balloon'
import CannotCastNonSTIModelToChild from '../../../src/exceptions/cannot-cast-non-sti-model-to-child'
import { AssociatedModelParam } from '../../../src/decorators/associations/shared'

describe('Dream#asChild', () => {
  it('recasts model based on STI children', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const mylar = await Mylar.create({ user, color: 'red' })

    const balloon = (await Balloon.first())!.asChild()
    expect(balloon!.as(Mylar)).toMatchDreamModel(mylar)
  })

  context('with a non-sti model', () => {
    it('raises a targeted exception', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      expect(() => user!.asChild()).toThrowError(CannotCastNonSTIModelToChild)
    })
  })
})
