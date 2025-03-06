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
    let mylar: Mylar

    beforeEach(async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      mylar = await Mylar.create({ user, color: 'red' })
      sandbag = await mylar.createAssociation('sandbags', { weight: 10 })
    })

    context('one of the attributes specified in the "ifChanging" clause is changing', () => {
      it('calls hook', async () => {
        vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveHook')
        await sandbag.update({ weight: 11 })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(Sandbag.prototype.conditionalAfterSaveHook).toHaveBeenCalled()
      })
    })

    context('none of the attributes specified in the "ifChanging" clause are changing', () => {
      it('calls hook', async () => {
        await sandbag.update({ weight: null })
        vi.spyOn(Sandbag.prototype, 'conditionalAfterSaveHook')
        await sandbag.update({ weightKgs: 120 })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(Sandbag.prototype.conditionalAfterSaveHook).not.toHaveBeenCalled()
      })
    })
  })
})
