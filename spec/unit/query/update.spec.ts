import DreamDbConnection from '../../../src/db/DreamDbConnection'
import ReplicaSafe from '../../../src/decorators/ReplicaSafe'
import NoUpdateAllOnJoins from '../../../src/errors/NoUpdateAllOnJoins'
import NoUpdateOnAssociationQuery from '../../../src/errors/NoUpdateOnAssociationQuery'
import modifiers from '../../../src/modifiers'
import ops from '../../../src/ops'
import Pet from '../../../test-app/app/models/Pet'
import User from '../../../test-app/app/models/User'

describe('Query#update', () => {
  it('takes passed params and sends them through to all models matchin query', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const numRecords = await User.query().update({
      name: 'cool',
    })
    expect(numRecords).toEqual(2)
    const records = await User.all()
    expect(records.map(r => r.name)).toMatchObject(['cool', 'cool'])
  })

  it('respects where clause', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const numRecords = await User.query().where({ email: 'how@yadoin' }).update({
      name: 'cool',
    })
    expect(numRecords).toEqual(1)

    await user1.reload()
    await user2.reload()

    expect(user1.name).toBeNull()
    expect(user2.name).toEqual('cool')
  })

  it('calls model hooks', async () => {
    await Pet.create()
    await Pet.query().update({ name: 'change me' })
    const pet = await Pet.first()
    expect(pet!.name).toEqual('changed by update hook')
  })

  context('skipHooks is passed', () => {
    it('skips model hooks', async () => {
      await Pet.create()
      await Pet.query().update({ name: 'change me' }, { skipHooks: true })
      const pet = await Pet.first()
      expect(pet!.name).toEqual('change me')
    })
  })

  context('within an associationQuery', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await user.createAssociation('compositions', { content: 'Opus' })

      await expect(user.associationQuery('compositions').update({ content: 'cool' })).rejects.toThrow(
        NoUpdateOnAssociationQuery
      )
    })
  })

  context('with joins', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await user.createAssociation('compositions', { content: 'Opus' })

      await expect(User.innerJoin('compositions').update({ name: 'cool' })).rejects.toThrow(
        NoUpdateAllOnJoins
      )
    })
  })

  context('with a similarity search applied', () => {
    it('respects a single similarity statement', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'calvin' })

      const numRecords = await User.query()
        .where({ name: ops.similarity('fres') })
        .update({
          name: 'cool',
        })
      expect(numRecords).toEqual(1)

      await user1.reload()
      await user2.reload()

      expect(user1.name).toEqual('cool')
      expect(user2.name).toEqual('calvin')
    })

    it('respects multiple similarity statements', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'calvin' })

      const numRecords = await User.query()
        .where({ name: ops.similarity('fres'), email: ops.similarity('fred@fred') })
        .update({
          name: 'cool',
        })
      expect(numRecords).toEqual(1)

      await user1.reload()
      await user2.reload()

      expect(user1.name).toEqual('cool')
      expect(user2.name).toEqual('calvin')
    })
  })

  context('arrays', () => {
    context('arrayCat', () => {
      it('provides support for updating an array field by pushing into it', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin', favoriteNumbers: [1] })
        await User.where({ id: user.id }).update({ favoriteNumbers: modifiers.arrayCat([2, 3]) })

        await user.reload()
        expect(user.favoriteNumbers).toEqual([1, 2, 3])
      })
    })

    context('arrayPush', () => {
      it('provides support for updating an array field by pushing into it', async () => {
        const user = await User.create({ email: 'fred@fred', password: 'howyadoin', favoriteNumbers: [1] })
        await User.where({ id: user.id }).update({ favoriteNumbers: modifiers.arrayAppend(2) })

        await user.reload()
        expect(user.favoriteNumbers).toEqual([1, 2])
      })
    })

    context('arrayRemove', () => {
      it('provides support for removing a value from an array field', async () => {
        const user = await User.create({
          email: 'fred@fred',
          password: 'howyadoin',
          favoriteNumbers: [1, 2, 3],
        })
        await User.where({ id: user.id }).update({ favoriteNumbers: modifiers.arrayRemove(2) })

        await user.reload()
        expect(user.favoriteNumbers).toEqual([1, 3])
      })
    })
  })

  context('regarding connections', () => {
    beforeEach(async () => {
      await User.create({ email: 'fred@fred', password: 'howyadoin' })

      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.where({ email: 'fred@fred' }).update({ email: 'how@yadoin' })
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the primary connection', async () => {
        await expect(CustomUser.findBy({ email: 'fred@fred' })).resolves.toBeTruthy()
        await CustomUser.where({ email: 'fred@fred' }).update({ email: 'how@yadoin' })

        // should always call to primary for update, regardless of replica-safe status
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')
      })
    })
  })
})
