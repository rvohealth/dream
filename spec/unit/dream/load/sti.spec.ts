import User from '../../../../test-app/app/models/User'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Latex from '../../../../test-app/app/models/Balloon/Latex'

describe('Dream#load with sti associations', () => {
  context('HasMany associations', () => {
    it('marshals data to correct class based on the type stored in the database', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      const latex = await Latex.create({ user, color: 'blue' })

      await user.load('balloons')
      expect(user.balloons).toMatchDreamModels([mylar, latex])
    })
  })
})
