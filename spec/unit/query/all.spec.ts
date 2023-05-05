import Balloon from '../../../test-app/app/models/balloon'
import User from '../../../test-app/app/models/user'

describe('Query#all', () => {
  it('returns multiple records', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records = await User.order('id').all()
    expect(records[0].id).toEqual(user1.id)
    expect(records[1].id).toEqual(user2.id)
  })

  context('STI associations are loaded', () => {
    it('correctly marshals each association to its respective dream class based on type', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Balloon.Mylar.create({ user, color: 'red' })
      const latex = await Balloon.Latex.create({ user, color: 'blue' })

      const users = await User.includes('balloons').all()
      expect(users[0].balloons).toMatchDreamModels([mylar, latex])
    })
  })
})
