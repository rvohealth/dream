import Balloon from '../../../../test-app/app/models/balloon'
import User from '../../../../test-app/app/models/user'
import { DateTime } from 'luxon'

describe('Dream STI', () => {
  let user: User | null = null

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
  })

  it('builds scope mapping', async () => {
    expect(Balloon.Base.sti.value).toEqual(null)

    expect(Balloon.Mylar.sti.value).toEqual('Mylar')
    expect(Balloon.Latex.sti.value).toEqual('Latex')
  })

  it('auto-applies the type field for STI classes upon insertion', async () => {
    const mylarBalloon = await Balloon.Mylar.create({
      user: user!,
      color: 'blue',
    })
    expect(mylarBalloon.type).toEqual('Mylar')
  })

  it('auto-applies a default scope for classes implementing STI', async () => {
    const mylarBalloon = await Balloon.Mylar.create({
      user: user!,
      color: 'blue',
    })
    await Balloon.Latex.create({
      user: user!,
      color: 'red',
    })

    const balloons = await Balloon.Mylar.all()
    expect(balloons).toMatchDreamModels([mylarBalloon])
  })

  it('correctly marshals each association to its respective dream class based on type', async () => {
    const mylar = await Balloon.Mylar.create({ user: user!, color: 'red' })
    const latex = await Balloon.Latex.create({ user: user!, color: 'blue' })

    const balloons = await Balloon.Base.all()
    expect(balloons).toMatchDreamModels([mylar, latex])
  })
})
