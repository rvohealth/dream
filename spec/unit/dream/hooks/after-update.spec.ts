import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Composition from '../../../../test-app/app/models/Composition'
import Sandbag from '../../../../test-app/app/models/Sandbag'
import User from '../../../../test-app/app/models/User'

describe('Dream AfterUpdate decorator', () => {
  it('runs the query after updating a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, content: 'howyadoin' })
    expect(composition.content).toEqual('howyadoin')

    await composition.update({ content: 'change me after update' })
    expect(composition.content).toEqual('changed after update')
  })

  context('with ifChanging set on hook decorator', () => {
    let sandbag: Sandbag

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      sandbag = await mylar.createAssociation('sandbags', { weightTons: 10 })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing to non-null', () => {
      it('calls hook', async () => {
        jest.spyOn(Sandbag.prototype, 'conditionalAfterUpdateHook')
        await sandbag.update({ weightTons: 11 })

        // eslint-disable-next-line
        expect(Sandbag.prototype.conditionalAfterUpdateHook).toHaveBeenCalled()
      })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing to null', () => {
      it('calls hook', async () => {
        await sandbag.update({ weightTons: 11 })

        jest.spyOn(Sandbag.prototype, 'conditionalAfterUpdateHook')
        await sandbag.update({ weightTons: null })

        // eslint-disable-next-line
        expect(Sandbag.prototype.conditionalAfterUpdateHook).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        await sandbag.update({ weightTons: null })
        jest.spyOn(Sandbag.prototype, 'conditionalAfterUpdateHook')
        await sandbag.update({ weightKgs: 120 })

        // eslint-disable-next-line
        expect(Sandbag.prototype.conditionalAfterUpdateHook).not.toHaveBeenCalled()
      })
    })
  })
})
