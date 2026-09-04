import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#delete', () => {
  it('deletes all records matching the query', async () => {
    await User.create({ email: 'fred@frewd', name: 'howyadoin', password: 'hamz' })
    await User.create({ email: 'how@yadoin', name: 'howyadoin', password: 'hamz' })
    const user3 = await User.create({ email: 'fish@yadoin', name: 'cheese', password: 'hamz' })

    await User.where({ name: 'howyadoin' }).delete()

    expect(await User.count()).toEqual(1)
    expect(await User.first()).toMatchDreamModel(user3)
  })

  it('deletes only STI child records when all default scopes are removed', async () => {
    const mylar = await Mylar.create({ color: 'red' })
    const deletedMylar = await Mylar.create({ color: 'blue' })
    await deletedMylar.destroy()
    const latex = await Latex.create({ color: 'green' })

    const count = await Mylar.removeAllDefaultScopes().delete()

    expect(count).toEqual(2)
    expect(
      await Balloon.removeAllDefaultScopes()
        .where({ id: [mylar.id, deletedMylar.id] })
        .count()
    ).toEqual(0)

    const reloadedLatex = await Balloon.findOrFail(latex.id)
    expect(reloadedLatex).toBeInstanceOf(Latex)
    expect(reloadedLatex.color).toEqual('green')
  })
})
