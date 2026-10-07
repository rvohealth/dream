import DreamDbConnection from '../../../src/db/DreamDbConnection.js'
import BatchingIncompatibleWithLimitOrOffset from '../../../src/errors/BatchingIncompatibleWithLimitOrOffset.js'
import ops from '../../../src/ops/index.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Composition from '../../../test-app/app/models/Composition.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import User from '../../../test-app/app/models/User.js'

describe('Query#findEach', () => {
  it('visits every record in ascending primary key order', async () => {
    const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })
    const userb = await User.create({ name: 'fred', email: 'b@b.com', password: 'howyadoin' })
    const userc = await User.create({ name: 'fred', email: 'c@c.com', password: 'howyadoin' })

    const records: User[] = []
    await User.query().findEach(user => {
      records.push(user)
    })
    expect(records.map(r => r.id)).toEqual([usera.id, userb.id, userc.id])
  })

  context('where clause is passed', () => {
    it('respects where clause', async () => {
      await User.create({ email: 'a@a.com', password: 'howyadoin' })
      const userb = await User.create({ name: 'fred', email: 'b@b.com', password: 'howyadoin' })
      const userc = await User.create({ name: 'fred', email: 'c@c.com', password: 'howyadoin' })

      const users: User[] = []
      await User.where({ name: 'fred' }).findEach(user => {
        users.push(user)
      })
      expect(users).toMatchDreamModels([userb, userc])
    })
  })

  context('when the Query carries an order', () => {
    it('ignores it, visiting records in ascending primary key order', async () => {
      const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
      const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
      const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

      const records: User[] = []
      await User.order('email').findEach(user => {
        records.push(user)
      })
      expect(records.map(r => r.id)).toEqual([userb.id, userc.id, usera.id])
    })

    it('ignores it across batches, visiting records in ascending primary key order', async () => {
      const userb = await User.create({ email: 'b@b.com', password: 'howyadoin' })
      const userc = await User.create({ email: 'c@c.com', password: 'howyadoin' })
      const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })

      const records: User[] = []
      await User.order('email').findEach(
        user => {
          records.push(user)
        },
        { batchSize: 2 }
      )
      expect(records.map(r => r.id)).toEqual([userb.id, userc.id, usera.id])
    })
  })

  context('when the Query carries a similarity condition', () => {
    // "chalupazz" passes the similarity threshold for "chalupa" but ranks below
    // an exact "chalupa", so the lowest primary keys rank last

    it('visits every match once, in ascending primary key order, across batches', async () => {
      const user1 = await User.create({ email: 'a@a.com', password: 'howyadoin', name: 'chalupazz' })
      const user2 = await User.create({ email: 'b@b.com', password: 'howyadoin', name: 'chalupazz' })
      const user3 = await User.create({ email: 'c@c.com', password: 'howyadoin', name: 'chalupa' })
      const user4 = await User.create({ email: 'd@d.com', password: 'howyadoin', name: 'chalupa' })
      await User.create({ email: 'e@e.com', password: 'howyadoin', name: 'calvin' })

      const records: User[] = []
      await User.where({ name: ops.similarity('chalupa') }).findEach(
        user => {
          records.push(user)
        },
        { batchSize: 2 }
      )
      expect(records.map(r => r.id)).toEqual([user1.id, user2.id, user3.id, user4.id])
    })

    context('on an innerJoin', () => {
      it('visits every match once, in ascending primary key order, across batches', async () => {
        const lowRankUser = await User.create({ email: 'a@a.com', password: 'howyadoin', name: 'chalupazz' })
        const highRankUser = await User.create({ email: 'b@b.com', password: 'howyadoin', name: 'chalupa' })
        const otherUser = await User.create({ email: 'c@c.com', password: 'howyadoin', name: 'calvin' })
        const composition1 = await Composition.create({ user: lowRankUser })
        const composition2 = await Composition.create({ user: lowRankUser })
        const composition3 = await Composition.create({ user: highRankUser })
        const composition4 = await Composition.create({ user: highRankUser })
        await Composition.create({ user: otherUser })

        const records: Composition[] = []
        await Composition.innerJoin('user', { and: { name: ops.similarity('chalupa') } }).findEach(
          composition => {
            records.push(composition)
          },
          { batchSize: 2 }
        )
        expect(records.map(r => r.id)).toEqual([
          composition1.id,
          composition2.id,
          composition3.id,
          composition4.id,
        ])
      })
    })

    context('on an associationQuery', () => {
      it('visits every match once, in ascending primary key order, across batches', async () => {
        const user = await User.create({ email: 'a@a.com', password: 'howyadoin' })
        const post1 = await Post.create({ user, body: 'chalupazz' })
        const post2 = await Post.create({ user, body: 'chalupazz' })
        const post3 = await Post.create({ user, body: 'chalupa' })
        const post4 = await Post.create({ user, body: 'chalupa' })
        await Post.create({ user, body: 'calvin' })

        const records: Post[] = []
        await user.associationQuery('posts', { and: { body: ops.similarity('chalupa') } }).findEach(
          post => {
            records.push(post)
          },
          { batchSize: 2 }
        )
        expect(records.map(r => r.id)).toEqual([post1.id, post2.id, post3.id, post4.id])
      })
    })
  })

  context('on an associationQuery whose association declares an order', () => {
    it('ignores that order, visiting every record once in ascending primary key order across batches', async () => {
      const user = await User.create({ email: 'a@a.com', password: 'howyadoin' })
      const post1 = await Post.create({ user })
      const post2 = await Post.create({ user })
      const post3 = await Post.create({ user })
      const post4 = await Post.create({ user })
      // orderedPosts orders by position, which now puts the lowest primary key last
      await post1.update({ position: 4 })

      const records: Post[] = []
      await user.associationQuery('orderedPosts').findEach(
        post => {
          records.push(post)
        },
        { batchSize: 2 }
      )
      expect(records.map(r => r.id)).toEqual([post1.id, post2.id, post3.id, post4.id])
    })
  })

  context('on an associationQuery of an association with distinct and an order led by it', () => {
    it('visits the record the association returns for each distinct value once, in ascending primary key order across batches', async () => {
      const pet = await Pet.create()
      const now = DateTime.now()
      await pet.createAssociation('collars', { tagName: 'a', createdAt: now.minus({ day: 1 }) })
      const newestA = await pet.createAssociation('collars', { tagName: 'a', createdAt: now })
      const newestB = await pet.createAssociation('collars', { tagName: 'b', createdAt: now })
      // older than newestB, but with a higher primary key
      await pet.createAssociation('collars', { tagName: 'b', createdAt: now.minus({ day: 1 }) })
      const newestC = await pet.createAssociation('collars', { tagName: 'c', createdAt: now })

      const records: Collar[] = []
      await pet.associationQuery('newestCollarPerTagName').findEach(
        collar => {
          records.push(collar)
        },
        { batchSize: 2 }
      )
      expect(records.map(r => r.id)).toEqual([newestA.id, newestB.id, newestC.id])
    })
  })

  context('when the Query joins an association with distinct and an order led by it', () => {
    it('visits each record the join returns once, in ascending primary key order across batches', async () => {
      const now = DateTime.now()
      const pet1 = await Pet.create()
      const pet2 = await Pet.create()
      const pet3 = await Pet.create()
      // its collar is not the newest with its tag name, so the join does not return it
      const pet4 = await Pet.create()
      await pet1.createAssociation('collars', { tagName: 'a', createdAt: now })
      await pet2.createAssociation('collars', { tagName: 'b', createdAt: now })
      await pet3.createAssociation('collars', { tagName: 'c', createdAt: now })
      await pet4.createAssociation('collars', { tagName: 'a', createdAt: now.minus({ day: 1 }) })

      const records: Pet[] = []
      await Pet.innerJoin('newestCollarPerTagName').findEach(
        pet => {
          records.push(pet)
        },
        { batchSize: 2 }
      )
      expect(records.map(r => r.id)).toEqual([pet1.id, pet2.id, pet3.id])
    })

    it('visits a record the join returns for more than one distinct value once', async () => {
      const now = DateTime.now()
      const pet1 = await Pet.create()
      const pet2 = await Pet.create()
      await pet1.createAssociation('collars', { tagName: 'a', createdAt: now })
      await pet1.createAssociation('collars', { tagName: 'b', createdAt: now })
      await pet2.createAssociation('collars', { tagName: 'c', createdAt: now })

      const records: Pet[] = []
      await Pet.innerJoin('newestCollarPerTagName').findEach(
        pet => {
          records.push(pet)
        },
        { batchSize: 1 }
      )
      expect(records.map(r => r.id)).toEqual([pet1.id, pet2.id])
    })

    it('does not visit a record the join returns only because the callback destroyed another, across batches', async () => {
      const now = DateTime.now()
      const pet1 = await Pet.create()
      const pet2 = await Pet.create()
      const pet3 = await Pet.create()
      // once pet1 is destroyed, the join returns this pet for tag name 'a'
      const pet4 = await Pet.create()
      await pet1.createAssociation('collars', { tagName: 'a', createdAt: now })
      await pet2.createAssociation('collars', { tagName: 'b', createdAt: now })
      await pet3.createAssociation('collars', { tagName: 'c', createdAt: now })
      await pet4.createAssociation('collars', { tagName: 'a', createdAt: now.minus({ day: 1 }) })

      const records: Pet[] = []
      await Pet.innerJoin('newestCollarPerTagName').findEach(
        async pet => {
          records.push(pet)
          await pet.destroy()
        },
        { batchSize: 2 }
      )
      expect(records.map(r => r.id)).toEqual([pet1.id, pet2.id, pet3.id])
    })
  })

  context('when the Query carries a limit or offset', () => {
    it('rejects them rather than corrupting the batch windows', async () => {
      // the batch windows re-apply the Query's conditions per batch, so a
      // carried limit would be silently replaced by the batch size and a
      // carried offset re-applied to every window
      const usera = await User.create({ email: 'a@a.com', password: 'howyadoin' })
      await User.create({ email: 'b@b.com', password: 'howyadoin' })

      await expect(
        User.query()
          .limit(1)
          .findEach(() => {})
      ).rejects.toThrow(BatchingIncompatibleWithLimitOrOffset)
      await expect(
        User.query()
          .offset(1)
          .findEach(() => {})
      ).rejects.toThrow(BatchingIncompatibleWithLimitOrOffset)

      // a limit of zero means "no limit", so it batches as if no limit were set
      const users: User[] = []
      await User.query()
        .limit(0)
        .findEach(user => {
          users.push(user)
        })
      expect(users.length).toEqual(2)
      expect(users[0]).toMatchDreamModel(usera)
    })
  })

  context('regarding connections', () => {
    it('uses primary connection', async () => {
      const spy = vi.spyOn(DreamDbConnection, 'getConnection')
      await User.query().findEach(() => {})

      expect(spy).toHaveBeenCalledWith('default', 'primary', expect.anything())
      expect(spy).not.toHaveBeenCalledWith('default', 'replica', expect.anything())
    })
  })
})
