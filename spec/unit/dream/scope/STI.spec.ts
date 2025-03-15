import { findExtendingDreamClass } from '../../../../src/dream/internal/sqlResultToDreamInstance.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream STI', () => {
  let user: User | null = null

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
  })

  describe('.isSTIBase', () => {
    context('when the model is not extended', () => {
      it('is false', () => {
        expect(User['isSTIBase']).toBe(false)
      })
    })

    context('when the model is extended', () => {
      it('is true', () => {
        expect(Balloon['isSTIBase']).toBe(true)
      })
    })

    context('when the model is extended, but also extends a Dream model', () => {
      it('is false', () => {
        expect(Latex['isSTIBase']).toBe(false)
      })
    })
  })

  describe('.isSTIChild', () => {
    context('when the model is not STI', () => {
      it('is false', () => {
        expect(User['isSTIChild']).toBe(false)
      })
    })

    context('when the model is extended', () => {
      it('is true', () => {
        expect(Balloon['isSTIChild']).toBe(false)
      })
    })

    context('when the model extends a Dream model', () => {
      it('is true', () => {
        expect(Mylar['isSTIChild']).toBe(true)
      })
    })

    context('when the model is extended, but also extends a Dream model', () => {
      it('is false', () => {
        expect(Latex['isSTIChild']).toBe(true)
      })
    })
  })

  describe('.sti.baseClass', () => {
    context('when the model is not STI', () => {
      it('is null', () => {
        expect(User['sti'].baseClass).toBeNull()
      })
    })

    context('when the model is an STI base class', () => {
      it('is null', () => {
        expect(Balloon['sti'].baseClass).toBeNull()
      })
    })

    context('when the model extends a Dream model', () => {
      it('is the base class extended by this Dream model', () => {
        expect(Mylar['sti'].baseClass).toEqual(Balloon)
      })
    })

    context('when the model is extended, but also extends a Dream model', () => {
      it('is the base class extended by this Dream model', () => {
        expect(Latex['sti'].baseClass).toEqual(Balloon)
      })
    })

    context('when the model extends a class that itself extends a class', () => {
      it('is the base class extended by this Dream model', () => {
        expect(Animal['sti'].baseClass).toEqual(Balloon)
      })
    })
  })

  it('builds scope mapping', () => {
    expect(Balloon['sti'].value).toBeNull()

    expect(Mylar['sti'].value).toEqual('Mylar')
    expect(Latex['sti'].value).toEqual('Latex')
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

    const balloon = await Mylar.first()
    expect(balloon).toMatchDreamModel(mylarBalloon)
  })

  context('STI extending an STI model', () => {
    it('applies the default scope one time (spec added when the sql included the type clause twice)', async () => {
      await Animal.create({
        user: user!,
        color: 'blue',
      })

      const sql = Animal.query().sql().sql
      expect([...sql.matchAll(/"beautiful_balloons"\."type" = \$/g)].length).toEqual(1)
    })

    it('querying the base class instantiates the second order STI model', async () => {
      const animal = await Animal.create({
        user: user!,
        color: 'blue',
      })

      const balloons = await Balloon.all()
      expect(balloons).toMatchDreamModels([animal])

      const balloon = await Balloon.first()
      expect(balloon).toMatchDreamModel(animal)
    })
  })

  it('correctly marshals each association to its respective dream class based on type', async () => {
    const mylar = await Mylar.create({ user: user!, color: 'red' })
    const latex = await Latex.create({ user: user!, color: 'blue' })

    const balloons = await Balloon.all()
    expect(balloons).toMatchDreamModels([mylar, latex])

    const balloon = await Balloon.first()
    expect(balloon).toMatchDreamModel(mylar)
  })

  describe('findExtendingDreamClass', () => {
    it('finds immediate extending classes', () => {
      expect(findExtendingDreamClass(Balloon, 'Mylar')).toEqual(Mylar)
      expect(findExtendingDreamClass(Balloon, 'Latex')).toEqual(Latex)
    })

    it('finds recursive extending classes', () => {
      expect(findExtendingDreamClass(Balloon, 'Animal')).toEqual(Animal)
    })
  })
})
