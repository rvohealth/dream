import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'
import ValidationError from '../../../../src/errors/ValidationError.js'

describe('Dream BeforeCreate decorator', () => {
  it('runs the query before creating a record', async () => {
    // const composition = await Composition.create()
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id })
    expect(composition.content).toEqual('default content')
  })

  context('when the hook fills a value a validation requires', () => {
    it('creates the record, because before-create hooks run before validation', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      vi.spyOn(Composition.prototype, 'setDefaultContent').mockImplementation(function (this: Composition) {
        this.userId = user.id
      })

      const composition = await Composition.create()

      const reloaded = await Composition.findOrFail(composition.id)
      expect(reloaded.userId).toEqual(user.id)
    })

    it('rejects with a ValidationError when hooks are skipped', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      vi.spyOn(Composition.prototype, 'setDefaultContent').mockImplementation(function (this: Composition) {
        this.userId = user.id
      })

      await expect(Composition.create({}, { skipHooks: true })).rejects.toThrow(ValidationError)
    })
  })

  context('with ifChanging set on hook decorator', () => {
    let mylar: Mylar

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      mylar = await Mylar.create({ user, color: 'red' })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing', () => {
      it('calls hook', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalBeforeCreateHook')
        await mylar.createAssociation('sandbags', { weightKgs: 10 })

        expect(spy).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalBeforeCreateHook')
        await mylar.createAssociation('sandbags')

        expect(spy).not.toHaveBeenCalled()
      })
    })
  })
})
