import DreamDbConnection from '../../../src/db/dream-db-connection'
import ReplicaSafe from '../../../src/decorators/replica-safe'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel'
import Balloon from '../../../test-app/app/models/Balloon'
import Latex from '../../../test-app/app/models/Balloon/Latex'
import Animal from '../../../test-app/app/models/Balloon/Latex/Animal'
import User from '../../../test-app/app/models/User'

describe('Dream.all', () => {
  it('finds all records for a given model', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const results = await User.all()
    expect(results.length).toEqual(2)
    expect(results[0].id).toEqual(user1.id)
    expect(results[1].id).toEqual(user2.id)
  })

  context('with specific columns to select', () => {
    it('only selects those fields', async () => {
      await User.create({ name: 'Fred', email: 'fred@frewd', password: 'howyadoin' })

      const results = await User.all({ columns: ['name'] })
      expect(results[0].name).toEqual('Fred')
      expect(results[0].email).toBeUndefined()
    })

    it('always selects id', async () => {
      const user = await User.create({ name: 'Fred', email: 'fred@frewd', password: 'howyadoin' })

      const results = await User.all({ columns: ['name'] })
      expect(results[0].id).toEqual(user.id)
    })

    context('STI models when "type" is not explicitly listed as a column to select', () => {
      it('querying an STI base instantiates the correct STI children', async () => {
        await Latex.create({ color: 'green' })

        const balloons = await Balloon.all({ columns: ['color'] })
        expect(balloons[0].type).toEqual('Latex')
        expect(balloons[0].color).toEqual('green')
      })

      it('querying an STI child works', async () => {
        await Latex.create({ color: 'green' })

        const latexBalloons = await Latex.all({ columns: ['color'] })
        expect(latexBalloons[0].type).toEqual('Latex')
        expect(latexBalloons[0].color).toEqual('green')
      })
    })
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
      await ApplicationModel.transaction(async txn => {
        user = await User.txn(txn).create({ email: 'fred@frewd', password: 'howyadoin' })
        users = await User.txn(txn).all()
      })
      expect(users).toMatchDreamModels([user])
    })

    context('with specific columns to select', () => {
      it('only selects those fields', async () => {
        await User.create({ name: 'Fred', email: 'fred@frewd', password: 'howyadoin' })
        let results: User[] = []

        await ApplicationModel.transaction(async txn => {
          results = await User.txn(txn).all({ columns: ['name'] })
        })

        expect(results[0].name).toEqual('Fred')
        expect(results[0].email).toBeUndefined()
      })
    })
  })

  context('regarding connections', () => {
    beforeEach(() => {
      jest.spyOn(DreamDbConnection, 'getConnection')
    })

    it('uses primary connection', async () => {
      await User.all()

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')
    })

    context('with replica connection specified', () => {
      @ReplicaSafe()
      class CustomUser extends User {}

      it('uses the replica connection', async () => {
        await CustomUser.all()

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('replica')
      })

      context('with explicit primary connection override', () => {
        it('uses the replica connection', async () => {
          await CustomUser['connection']('primary').all()

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(DreamDbConnection.getConnection).toHaveBeenCalledWith('primary')

          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(DreamDbConnection.getConnection).not.toHaveBeenCalledWith('replica')
        })
      })
    })
  })
})
