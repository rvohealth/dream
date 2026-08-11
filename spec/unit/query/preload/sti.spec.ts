import DreamApp, { KyselyLogEvent } from '../../../../src/dream-app/index.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Sandbag from '../../../../test-app/app/models/Sandbag.js'
import User from '../../../../test-app/app/models/User.js'

/**
 * Collects the SQL of every query the database driver logs while `cb` runs.
 */
async function sqlIssuedDuring(cb: () => Promise<void>): Promise<string[]> {
  const sql: string[] = []
  const dbLogHooks = DreamApp.getOrFail().specialHooks.dbLog
  const hook = (event: KyselyLogEvent) => sql.push(event.query.sql)
  dbLogHooks.push(hook)

  try {
    await cb()
  } finally {
    dbLogHooks.splice(dbLogHooks.indexOf(hook), 1)
  }

  return sql
}

describe('Query#preload with sti associations', () => {
  context('HasMany associations', () => {
    it('marshals data to correct class based on the type stored in the database', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      const latex = await Latex.create({ user, color: 'blue' })

      const reloadedUser = await User.query().preload('balloons').first()
      expect(reloadedUser!.balloons).toMatchDreamModels([mylar, latex])
    })
  })

  context('preloading an association declared on the STI base', () => {
    it('resolves the association for every STI child in a single query', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const mylar = await Mylar.create({ user, color: 'red' })
      const latex = await Latex.create({ user, color: 'blue' })
      const animal = await Animal.create({ user, color: 'green' })
      const mylarSandbag = await Sandbag.create({ mylar, weight: 10 })
      const latexSandbag = await Sandbag.create({ balloonId: latex.id, weight: 20 })
      const animalSandbag = await Sandbag.create({ balloonId: animal.id, weight: 30 })

      let balloons: Balloon[] = []
      const sql = await sqlIssuedDuring(async () => {
        balloons = await Balloon.query().preload('sandbags').all()
      })

      expect(balloons).toMatchDreamModels([mylar, latex, animal])
      expect(balloons.find(balloon => balloon.id === mylar.id)!.sandbags).toMatchDreamModels([mylarSandbag])
      expect(balloons.find(balloon => balloon.id === latex.id)!.sandbags).toMatchDreamModels([latexSandbag])
      expect(balloons.find(balloon => balloon.id === animal.id)!.sandbags).toMatchDreamModels([animalSandbag])

      expect(sql.filter(statement => /\bsandbags\b/.test(statement))).toHaveLength(1)
    })
  })
})
