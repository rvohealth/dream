import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import ModelWithSerialPrimaryKey from '../../../test-app/app/models/ModelWithSerialPrimaryKey.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.find', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
  })

  it('returns the matching Dream model', async () => {
    expect(await User.find(user.id)).toMatchDreamModel(user)
  })

  context('when passed undefined', () => {
    it('returns null', async () => {
      expect(await User.find(undefined)).toBeNull()
    })
  })

  context('when passed null', () => {
    it('returns null', async () => {
      expect(await User.find(null)).toBeNull()
    })
  })

  context('when passed the id of a nonextant User', () => {
    it('returns null', async () => {
      expect(await User.find((parseInt(user.id) + 1).toString())).toBeNull()
    })
  })

  context('STI model', () => {
    it('is instantiated as the type specified in the type field', async () => {
      const latexBalloon = await Latex.create({ color: 'green' })
      const balloon = await Balloon.find(latexBalloon.id)
      expect(balloon).toMatchDreamModel(latexBalloon)
    })
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      await ApplicationModel.transaction(async txn => {
        expect(await User.txn(txn).find(user.id)).toMatchDreamModel(user)
      })
    })

    context('when passed undefined', () => {
      it('returns null', async () => {
        await ApplicationModel.transaction(async txn => {
          expect(await User.txn(txn).find(undefined)).toBeNull()
        })
      })
    })

    context('when passed null', () => {
      it('returns null', async () => {
        await ApplicationModel.transaction(async txn => {
          expect(await User.txn(txn).find(null)).toBeNull()
        })
      })
    })
  })

  context('a model with a serial primary key', () => {
    it('can be found by a string', async () => {
      const model = await ModelWithSerialPrimaryKey.create()
      const foundModel = await ModelWithSerialPrimaryKey.find(model.id.toString())
      expect(foundModel).toMatchDreamModel(model)
    })
  })
})
