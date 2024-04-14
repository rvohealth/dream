import User from '../../../test-app/app/models/User'
import ReplicaSafe from '../../../src/decorators/replica-safe'
import DreamDbConnection from '../../../src/db/dream-db-connection'
import NoUpdateAllOnAssociationQuery from '../../../src/exceptions/no-updateall-on-association-query'
import ops from '../../../src/ops'
import NoUpdateAllOnJoins from '../../../src/exceptions/no-updateall-on-joins'

describe('Query#updateAll', () => {
  it('takes passed params and sends them through to all models matchin query', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const numRecords = await User.query().updateAll({
      name: 'cool',
    })
    expect(numRecords).toEqual(2)
    const records = await User.all()
    expect(records.map(r => r.name)).toMatchObject(['cool', 'cool'])
  })

  it('respects where clause', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const numRecords = await User.query().where({ email: 'how@yadoin' }).updateAll({
      name: 'cool',
    })
    expect(numRecords).toEqual(1)

    await user1.reload()
    await user2.reload()

    expect(user1.name).toBeNull()
    expect(user2.name).toEqual('cool')
  })

  context('within an associationQuery', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await user.createAssociation('compositions', { content: 'Opus' })

      await expect(user.associationQuery('compositions').updateAll({ content: 'cool' })).rejects.toThrow(
        NoUpdateAllOnAssociationQuery
      )
    })
  })

  context('with joins', () => {
    it('raises an exception', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      await user.createAssociation('compositions', { content: 'Opus' })

      await expect(User.joins('compositions').updateAll({ name: 'cool' })).rejects.toThrow(NoUpdateAllOnJoins)
    })
  })

  context('with a similarity search applied', () => {
    it('respects a single similarity statement', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'calvin' })

      const numRecords = await User.query()
        .where({ name: ops.similarity('fres') })
        .updateAll({
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
        .updateAll({
          name: 'cool',
        })
      expect(numRecords).toEqual(1)

      await user1.reload()
      await user2.reload()

      expect(user1.name).toEqual('cool')
      expect(user2.name).toEqual('calvin')
    })
  })

  context('within an associationUpdateQuery', () => {
    it('only updates the associated records', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition1 = await user1.createAssociation('compositions', { content: 'Opus1' })

      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const composition2 = await user2.createAssociation('compositions', { content: 'Opus2' })

      const numRecords = await user2.associationUpdateQuery('compositions').updateAll({
        content: 'cool',
      })
      expect(numRecords).toEqual(1)

      await composition1.reload()
      await composition2.reload()

      expect(composition1.content).toEqual('Opus1')
      expect(composition2.content).toEqual('cool')
    })

    context('when a similarity clause is included', () => {
      it('respects the similarity clause', async () => {
        const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
        const composition1 = await user1.createAssociation('compositions', { content: 'Opus1' })

        const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'calvin' })
        const composition2 = await user2.createAssociation('compositions', { content: 'Opus2' })
        const composition3 = await user2.createAssociation('compositions', { content: 'chalupas dujour' })

        const numRecords = await user2
          .associationUpdateQuery('compositions')
          .where({
            content: ops.similarity('Opus'),
          })
          .updateAll({
            content: 'cool',
          })
        expect(numRecords).toEqual(1)

        await composition1.reload()
        await composition2.reload()
        await composition3.reload()

        expect(composition1.content).toEqual('Opus1')
        expect(composition2.content).toEqual('cool')
        expect(composition3.content).toEqual('chalupas dujour')
      })
    })

    it('respects where clauses', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition1 = await user1.createAssociation('compositions', { content: 'Opus1' })

      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const composition2 = await user2.createAssociation('compositions', { content: 'Opus2' })
      const composition3 = await user2.createAssociation('compositions', { content: 'Opus3' })

      const numRecords = await user2
        .associationUpdateQuery('compositions')
        .where({ content: 'Opus3' })
        .updateAll({
          content: 'cool',
        })
      expect(numRecords).toEqual(1)

      await composition1.reload()
      await composition2.reload()
      await composition3.reload()

      expect(composition1.content).toEqual('Opus1')
      expect(composition2.content).toEqual('Opus2')
      expect(composition3.content).toEqual('cool')
    })
  })

  context('regarding connections', () => {
    beforeEach(async () => {
      await User.create({ email: 'fred@fred', password: 'howyadoin' })

      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.where({ email: 'fred@fred' }).updateAll({ email: 'how@yadoin' })
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary', expect.objectContaining({}))
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the primary connection', async () => {
        await CustomUser.where({ email: 'fred@fred' }).updateAll({ email: 'how@yadoin' })

        // should always call to primary for update, regardless of replica-safe status
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary', expect.objectContaining({}))
      })
    })
  })
})
