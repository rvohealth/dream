import Mylar from '../../../../test-app/app/models/Balloon/Mylar'
import Composition from '../../../../test-app/app/models/Composition'
import Sandbag from '../../../../test-app/app/models/Sandbag'
import User from '../../../../test-app/app/models/User'

describe('Dream AfterSave decorator', () => {
  it('runs the query after saving a record', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ userId: user.id, content: 'change me after save' })
    expect(composition.content).toEqual('changed after save')

    await composition.reload()
    expect(composition.content).toEqual('change me after save')

    await composition.update({ content: 'something else' })
    expect(composition.content).toEqual('something else')

    await composition.update({ content: 'change me after save' })
    expect(composition.content).toEqual('changed after save')
    await composition.save()
    await composition.reload()
    expect(composition.content).toEqual('changed after save')
  })

  context('with ifChanging set on hook decorator', () => {
    let sandbag: Sandbag

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      sandbag = await mylar.createAssociation('sandbags', { weight: 10 })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing', () => {
      it('calls hook', async () => {
        jest.spyOn(Sandbag.prototype, 'afterConditionalHook')
        await sandbag.update({ weight: 11 })
        expect(Sandbag.prototype.afterConditionalHook).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        await sandbag.update({ weight: null })
        jest.spyOn(Sandbag.prototype, 'afterConditionalHook')
        await sandbag.update({ weightKgs: 120 })
        expect(Sandbag.prototype.afterConditionalHook).not.toHaveBeenCalled()
      })
    })
  })
})
