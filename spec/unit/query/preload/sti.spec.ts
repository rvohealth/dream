import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import User from '../../../../test-app/app/models/User.js'

describe('Query#preload with sti associations', () => {
  context('HasMany associations', () => {
    it('marshals data to correct class based on the type stored in the database', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      const latex = await Latex.create({ user, color: 'blue' })

      const reloadedUser = await User.query().preload('balloons').first()
      expect(reloadedUser!.balloons).toMatchDreamModels([mylar, latex])
    })
  })
})
