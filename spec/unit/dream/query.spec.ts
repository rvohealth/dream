import { sql } from 'kysely'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'

describe('.query', () => {
  it('returns a Kysely query scoped to the Dream class', async () => {
    const balloon1 = await Mylar.create({ multicolor: ['red', 'blue'] })
    const balloon2 = await Mylar.create({ multicolor: ['green', 'blue'] })

    const colorToRemoveFromAllBalloons = 'blue'

    await Balloon.query()
      .toKysely('update')
      .set({
        multicolor: sql`array_remove(multicolor, ${colorToRemoveFromAllBalloons})`,
      })
      .execute()

    await balloon1.reload()
    await balloon2.reload()
    expect(balloon1.multicolor).toEqual(['red'])
    expect(balloon2.multicolor).toEqual(['green'])
  })
})

describe('#query', () => {
  it('returns a Kysely query scoped to the Dream class', async () => {
    const balloon1 = await Mylar.create({ multicolor: ['red'] })
    const balloon2 = await Mylar.create({ multicolor: ['green'] })

    await balloon2
      .query()
      .toKysely('update')
      .set({
        multicolor: sql`array_append(multicolor, 'blue')`,
      })
      .execute()

    await balloon1.reload()
    await balloon2.reload()
    expect(balloon1.multicolor).toEqual(['red'])
    expect(balloon2.multicolor).toEqual(['green', 'blue'])
  })
})
