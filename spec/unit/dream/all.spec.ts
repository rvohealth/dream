import User from '../../../src/test-app/app/models/user'
import Composition from '../../../src/test-app/app/models/composition'

describe('Dream.all', () => {
  it('finds all records for a given model', async () => {
    const composition = await Composition.create()
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const results = await User.all()
    expect(results.length).toEqual(2)
    expect(results[0].id).toEqual(user1.id)
    expect(results[1].id).toEqual(user2.id)

    const otherResults = await Composition.all()
    expect(otherResults.length).toEqual(1)
    expect(otherResults[0].id).toEqual(composition.id)
  })
})
