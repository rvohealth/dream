import RecordNotFound from '../../../src/errors/RecordNotFound.js'
import ops from '../../../src/ops.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#lastOrFail', () => {
  it('returns last record found, ordered by id', async () => {
    await User.create({ email: 'b@b.com', password: 'howyadoin' })
    await User.create({ email: 'c@c.com', password: 'howyadoin' })
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.query().lastOrFail()
    expect(record).toMatchDreamModel(usera)
  })

  context('the record is not found', () => {
    it('raises an exception', async () => {
      await expect(User.query().lastOrFail()).rejects.toThrow(RecordNotFound)
    })
  })

  context('where clause is passed', () => {
    it('respects where', async () => {
      const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
      await User.create({ email: 'c@c.com', password: 'howyadoin' })
      await User.create({ email: 'a@a.com', password: 'howyadoin' })

      const record = await User.order('email').where({ email: 'b@b.com' }).lastOrFail()
      expect(record).toMatchDreamModel(userb)
    })

    context('similarity operator is used', () => {
      it('correctly filters on similarity text', async () => {
        await User.create({ name: 'coolguy', email: 'cool@guy', password: 'howyadoin' })
        await User.create({ name: 'fred o', email: 'fred@fred', password: 'howyadoin' })
        const user2 = await User.create({ name: 'fred o', email: 'frewd@fred', password: 'howyadoin' })

        expect(
          await User.query()
            .where({ name: ops.similarity('fredo') })
            .lastOrFail()
        ).toMatchDreamModel(user2)
        await expect(
          User.query()
            .where({ name: ops.similarity('nonmatch') })
            .lastOrFail()
        ).rejects.toThrow(RecordNotFound)
      })
    })
  })

  it('respects order', async () => {
    await User.create({ email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
    await User.create({ email: 'a@a.com', password: 'howyadoin' })

    const record = await User.order('email').lastOrFail()
    expect(record).toMatchDreamModel(userc)
  })
})
