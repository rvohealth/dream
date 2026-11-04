import DataTypeColumnTypeMismatch from '../../../src/errors/db/DataTypeColumnTypeMismatch.js'
import { sql } from 'kysely'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import ModelWithSerialPrimaryKey from '../../../test-app/app/models/ModelWithSerialPrimaryKey.js'
import NonNullRating from '../../../test-app/app/models/NonNullRating.js'
import User from '../../../test-app/app/models/User.js'
import db from '../../../test-app/db/index.js'

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

    context('the database has a column the compiled schema does not know about (rolling-deploy skew)', () => {
      beforeEach(async () => {
        await sql`ALTER TABLE beautiful_balloons ADD COLUMN IF NOT EXISTS brandnewcolumn varchar(255) DEFAULT 'from the future'`.execute(
          db('default', 'primary')
        )
      })

      afterEach(async () => {
        await sql`ALTER TABLE beautiful_balloons DROP COLUMN IF EXISTS brandnewcolumn`.execute(
          db('default', 'primary')
        )
      })

      it('hydrates the correct STI child class via find without the unknown column', async () => {
        const latexBalloon = await Latex.create({ color: 'green' })
        const balloon = await Balloon.find(latexBalloon.id)
        expect(balloon).toMatchDreamModel(latexBalloon)
        expect(balloon).toBeInstanceOf(Latex)
        expect((balloon as any).brandnewcolumn).toBeUndefined()
        expect(Object.keys(balloon!.getAttributes())).not.toContain('brandnewcolumn')
      })

      it('hydrates the correct STI child class via all without the unknown column', async () => {
        const latexBalloon = await Latex.create({ color: 'green' })
        const balloons = await Balloon.all()
        expect(balloons).toMatchDreamModels([latexBalloon])
        expect(balloons[0]).toBeInstanceOf(Latex)
        expect((balloons[0] as any).brandnewcolumn).toBeUndefined()
        expect(Object.keys(balloons[0]!.getAttributes())).not.toContain('brandnewcolumn')
      })
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

  context('when passed a value the primary key column cannot hold', () => {
    it('returns null for a value that is not an integer', async () => {
      expect(await User.find('abc')).toBeNull()
    })

    it('returns null for an integer too large for the column', async () => {
      expect(await User.find('99999999999999999999')).toBeNull()
      expect(await ModelWithSerialPrimaryKey.find(3000000000)).toBeNull()
    })

    it('returns null on a model whose default scope negates a clause', async () => {
      expect(await NonNullRating.find('abc')).toBeNull()
    })

    context('in a transaction', () => {
      it('raises DataTypeColumnTypeMismatch, since the database has aborted the transaction', async () => {
        await expect(
          ApplicationModel.transaction(async txn => {
            await User.txn(txn).find('abc')
          })
        ).rejects.toThrow(DataTypeColumnTypeMismatch)
      })
    })
  })
})
