import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Composition from '../../../../test-app/app/models/Composition'
import Sandbag from '../../../../test-app/app/models/Sandbag'
import User from '../../../../test-app/app/models/User'

describe('Dream BeforeCreate decorator', () => {
  it('runs the query before creating a record', async () => {
    // const composition = await Composition.create()
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id })
    expect(composition.content).toEqual('default content')
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
        jest.spyOn(Sandbag.prototype, 'conditionalBeforeCreateHook')
        sandbag = await mylar.createAssociation('sandbags', { weightKgs: 10 })
        expect(Sandbag.prototype.conditionalBeforeCreateHook).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        jest.spyOn(Sandbag.prototype, 'conditionalBeforeCreateHook')
        sandbag = await mylar.createAssociation('sandbags')
        expect(Sandbag.prototype.conditionalBeforeCreateHook).not.toHaveBeenCalled()
      })
    })
  })
})
