import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Composition from '../../../../test-app/app/models/Composition'
import Sandbag from '../../../../test-app/app/models/Sandbag'
import User from '../../../../test-app/app/models/User'

describe('Dream AfterCreate decorator', () => {
  it('runs the query after creating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, content: 'change me after create' })
    expect(composition.content).toEqual('changed after create')
  })

  context('with ifChanging set on hook decorator', () => {
    let mylar: Mylar
    let sandbag: Sandbag

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      mylar = await Mylar.create({ user, color: 'red' })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing', () => {
      it('calls hook', async () => {
        jest.spyOn(Sandbag.prototype, 'afterConditionalHook')
        sandbag = await mylar.createAssociation('sandbags', { weightKgs: 10 })
        expect(Sandbag.prototype.afterConditionalHook).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        jest.spyOn(Sandbag.prototype, 'afterConditionalHook')
        sandbag = await mylar.createAssociation('sandbags', { weight: 10 })
        expect(Sandbag.prototype.afterConditionalHook).not.toHaveBeenCalled()
      })
    })
  })
})
