import User from '../../../test-app/app/models/User'
import Animal from '../../../test-app/app/models/Balloon/Latex/Animal'
import Balloon from '../../../test-app/app/models/Balloon'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import DreamDbConnection from '../../../src/db/dream-db-connection'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'

describe('Dream.findEach', () => {
  it('finds all records for a given model', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const records: User[] = []
    await User.findEach(user => {
      records.push(user)
    })

    expect(records).toMatchDreamModels([user1, user2])
  })

  context('with chunk size specified', () => {
    it('finds all records for a given model', async () => {
      const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const user3 = await User.create({ email: 'what@yadoin', password: 'howyadoin' })
      const user4 = await User.create({ email: 'where@yadoin', password: 'howyadoin' })
      const user5 = await User.create({ email: 'why@yadoin', password: 'howyadoin' })

      const records: User[] = []
      await User.findEach(
        user => {
          records.push(user)
        },
        { batchSize: 2 }
      )

      expect(records).toMatchDreamModels([user1, user2, user3, user4, user5])
    })
  })

  context('STI models', () => {
    it('are instantiated as the type specified in the type field', async () => {
      const latexBalloon = await Latex.create({ color: 'green' })
      const animalBalloon = await Animal.create({ color: 'red' })
      const balloons: any[] = []
      await Balloon.findEach(balloon => {
        balloons.push(balloon)
      })
      expect(balloons).toMatchDreamModels([latexBalloon, animalBalloon])
    })
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      const users: User[] = []
      let user: User | null = null
      await ApplicationModel.transaction(async txn => {
        user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        await User.txn(txn).findEach(user => {
          users.push(user)
        })
      })

      expect(users).toMatchDreamModels([user])
    })
  })

  context('regarding connections', () => {
    beforeEach(() => {
      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.findEach(() => {})

      // eslint-disable-next-line
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary', expect.objectContaining({}))
    })
  })
})
