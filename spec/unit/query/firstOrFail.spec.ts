import RecordNotFound from '../../../src/errors/RecordNotFound.js'
import ops from '../../../src/ops.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#firstOrFail', () => {
  it('returns first record found, ordered by id', async () => {
    const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
    await User.create({ email: 'c@c.com', password: 'howyadoin' })
    await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.firstOrFail()
    expect(record).toMatchDreamModel(userb)
  })

  context('the record is not found', () => {
    it('raises an exception', async () => {
      await expect(User.query().firstOrFail()).rejects.toThrow(RecordNotFound)
    })
  })

  context('where clause is passed', () => {
    it('respects where', async () => {
      const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
      await User.create({ email: 'c@c.com', password: 'howyadoin' })
      await User.create({ email: 'a@a.com', password: 'howyadoin' })

      const record = await User.order('email').where({ email: 'b@b.com' }).firstOrFail()
      expect(record).toMatchDreamModel(userb)
    })

    context('similarity operator is used', () => {
      it('correctly filters on similarity text', async () => {
        const user = await User.create({ name: 'fred o', email: 'fred@fred', password: 'howyadoin' })
        await User.create({ name: 'fred o', email: 'frewd@fred', password: 'howyadoin' })

        expect(
          await User.query()
            .where({ name: ops.similarity('fredo') })
            .firstOrFail()
        ).toMatchDreamModel(user)
        await expect(
          User.query()
            .where({ name: ops.similarity('nonmatch') })
            .firstOrFail()
        ).rejects.toThrow(RecordNotFound)
      })
    })
  })

  it('respects order', async () => {
    await User.create({ email: 'b@b.com', password: 'howyadoin' })
    await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.order('email').firstOrFail()
    expect(record).toMatchDreamModel(usera)
  })
})
