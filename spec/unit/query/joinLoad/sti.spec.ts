import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import User from '../../../../test-app/app/models/User'

describe('Query#include with sti associations', () => {
  context('HasMany associations', () => {
    it('marshals data to correct class based on the type stored in the database', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      const latex = await Latex.create({ user, color: 'blue' })

      const reloadedUser = (await User.query().joinLoad('balloons').all())[0]
      expect(reloadedUser.balloons).toMatchDreamModels([mylar, latex])
    })
  })
})
