import User from '../../../../test-app/app/models/user'
import Balloon from '../../../../test-app/app/models/balloon'

describe('Dream#load with sti associations', () => {
  context('HasMany associations', () => {
    it('marshals data to correct class based on the type stored in the database', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Balloon.Mylar.create({ user, color: 'red' })
      const latex = await Balloon.Latex.create({ user, color: 'blue' })

      await user.load('balloons')
      expect(user.balloons).toMatchDreamModels([mylar, latex])
    })
  })
})
