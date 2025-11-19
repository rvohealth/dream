import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream AfterCreate decorator', () => {
  it('runs the query after creating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, content: 'change me after create' })
    expect(composition.content).toEqual('changed after create')
  })

  context('with ifChanging set on hook decorator', () => {
    let mylar: Mylar

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      mylar = await Mylar.create({ user, color: 'red' })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing to non-null', () => {
      it('calls hook', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateHook')
        await mylar.createAssociation('sandbags', { weightKgs: 10 })

        expect(spy).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        const spy = vi.spyOn(Sandbag.prototype, 'conditionalAfterCreateHook')
        await mylar.createAssociation('sandbags', { weightTons: 10 })

        expect(spy).not.toHaveBeenCalled()
      })
    })
  })
})
