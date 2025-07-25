import RecordNotFound from '../../../src/errors/RecordNotFound.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.findOrFail', () => {
  let user: User

  beforeEach(async () => {
    user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
  })

  it('returns the matching Dream model', async () => {
    expect(await User.findOrFail(user.id)).toMatchDreamModel(user)
  })

  context('when passed undefined', () => {
    it('raises an exception', async () => {
      await expect(User.findOrFail(undefined)).rejects.toThrow(RecordNotFound)
    })
  })

  context('when passed null', () => {
    it('raises an exception', async () => {
      await expect(User.findOrFail(null)).rejects.toThrow(RecordNotFound)
    })
  })

  context('when passed the id of a nonextant User', () => {
    it('raises an exception', async () => {
      await expect(User.findOrFail((parseInt(user.id) + 1).toString())).rejects.toThrow(RecordNotFound)
    })
  })

  context('STI model', () => {
    it('is instantiated as the type specified in the type field', async () => {
      const latexBalloon = await Latex.create({ color: 'green' })
      const balloon = await Balloon.findOrFail(latexBalloon.id)
      expect(balloon).toMatchDreamModel(latexBalloon)
    })
  })

  context('when passed a transaction', () => {
    it('can find records', async () => {
      await ApplicationModel.transaction(async txn => {
        expect(await User.txn(txn).findOrFail(user.id)).toMatchDreamModel(user)
      })
    })

    context('when no record is found', () => {
      it('raises an exception', async () => {
        await ApplicationModel.transaction(async txn => {
          await expect(User.txn(txn).findOrFail('0')).rejects.toThrow(RecordNotFound)
        })
      })
    })

    context('when passed undefined', () => {
      it('raises an exception', async () => {
        await ApplicationModel.transaction(async txn => {
          await expect(User.txn(txn).findOrFail(undefined)).rejects.toThrow(RecordNotFound)
        })
      })
    })

    context('when passed null', () => {
      it('raises an exception', async () => {
        await ApplicationModel.transaction(async txn => {
          await expect(User.txn(txn).findOrFail(null)).rejects.toThrow(RecordNotFound)
        })
      })
    })
  })
})
