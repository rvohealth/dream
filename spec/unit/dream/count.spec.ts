import User from '../../../src/test-app/app/models/user'
import Composition from '../../../src/test-app/app/models/composition'

describe('Dream.count', () => {
  it('finds all records for a given model', async () => {
    await Composition.create()
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const results = await User.count()
    expect(results).toEqual(2)

    const otherResults = await Composition.count()
    expect(otherResults).toEqual(1)
  })
})
