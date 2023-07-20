import { Query } from '../../../../src'
import Balloon from '../../../../test-app/app/models/Balloon'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import User from '../../../../test-app/app/models/User'
import { DateTime } from 'luxon'

describe('Dream STI', () => {
  let user: User | null = null

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
  })

  it('builds scope mapping', async () => {
    expect(Balloon.sti.value).toBeNull()

    expect(Mylar.sti.value).toEqual('Mylar')
    expect(Latex.sti.value).toEqual('Latex')
  })

  it('auto-applies the type field for STI classes upon insertion', async () => {
    const mylarBalloon = await Mylar.create({
      user: user!,
      color: 'blue',
    })
    expect(mylarBalloon.type).toEqual('Mylar')
  })

  it('auto-applies a default scope for classes implementing STI', async () => {
    const mylarBalloon = await Mylar.create({
      user: user!,
      color: 'blue',
    })
    await Latex.create({
      user: user!,
      color: 'red',
    })

    const balloons = await Mylar.all()
    expect(balloons).toMatchDreamModels([mylarBalloon])
  })

  context('nested STI', () => {
    it('applies the default scope one time', async () => {
      const animal = await Animal.create({
        user: user!,
        color: 'blue',
      })

      const sql = new Query(Animal).sql().sql
      expect([...sql.matchAll(/"beautiful_balloons"\."type" = \$/g)].length).toEqual(1)
    })
  })

  it('correctly marshals each association to its respective dream class based on type', async () => {
    const mylar = await Mylar.create({ user: user!, color: 'red' })
    const latex = await Latex.create({ user: user!, color: 'blue' })

    const balloons = await Balloon.all()
    expect(balloons).toMatchDreamModels([mylar, latex])
  })
})
