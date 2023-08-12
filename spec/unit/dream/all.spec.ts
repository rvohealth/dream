import User from '../../../test-app/app/models/User'
import Composition from '../../../test-app/app/models/Composition'
import { Dream } from '../../../src'
import Animal from '../../../test-app/app/models/Balloon/Latex/Animal'
import Balloon from '../../../test-app/app/models/Balloon'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import ConnectionRetriever from '../../../src/db/connection-retriever'
import ReplicaSafe from '../../../src/decorators/replica-safe'

describe('Dream.all', () => {
  it('finds all records for a given model', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const results = await User.all()
    expect(results.length).toEqual(2)
    expect(results[0].id).toEqual(user1.id)
    expect(results[1].id).toEqual(user2.id)
  })

  context('STI models', () => {
    it('are instantiated as the type specified in the type field', async () => {
      const latexBalloon = await Latex.create({ color: 'green' })
      const animalBalloon = await Animal.create({ color: 'red' })
      const balloons = await Balloon.all()
      expect(balloons).toMatchDreamModels([latexBalloon, animalBalloon])
    })
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      let users: User[] = []
      let user: User | null = null
      await Dream.transaction(async txn => {
        user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        users = await User.txn(txn).all()
      })
      expect(users).toMatchDreamModels([user])
    })
  })

  context('regarding connections', () => {
    beforeEach(() => {
      jest.spyOn(ConnectionRetriever.prototype, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.all()
      expect(ConnectionRetriever.prototype.getConnection).toHaveBeenCalledWith('primary')
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the replica connection', async () => {
        await CustomUser.all()
        expect(ConnectionRetriever.prototype.getConnection).toHaveBeenCalledWith('replica')
      })

      context('with a transaction specified', () => {
        it('uses the primary connection, since all connections in transaction need to use the same connection', async () => {
          await CustomUser.transaction(async txn => {
            await CustomUser.txn(txn).connection('replica').all()
          })
          expect(ConnectionRetriever.prototype.getConnection).toHaveBeenCalledWith('primary')
          expect(ConnectionRetriever.prototype.getConnection).not.toHaveBeenCalledWith('replica')
        })
      })

      context('with explicit primary connection override', () => {
        it('uses the replica connection', async () => {
          await CustomUser.connection('primary').all()
          expect(ConnectionRetriever.prototype.getConnection).toHaveBeenCalledWith('primary')
          expect(ConnectionRetriever.prototype.getConnection).not.toHaveBeenCalledWith('replica')
        })
      })
    })
  })
})
