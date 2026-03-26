import CircularReferenceModel from '../../../../test-app/app/models/CircularReferenceModel.js'
import CircularReferenceModelA from '../../../../test-app/app/models/CircularReference/ModelA.js'
import CircularReferenceModelB from '../../../../test-app/app/models/CircularReference/ModelB.js'

describe('Dream#destroy with circular/self-referential dependent: destroy', () => {
  context('self-referential tree (CircularReferenceModel)', () => {
    it('destroys a chain of depth 2', async () => {
      const root = await CircularReferenceModel.create({})
      await CircularReferenceModel.create({ parent: root })

      await root.destroy()

      expect(await CircularReferenceModel.count()).toEqual(0)
    })

    it('destroys a chain of depth 4', async () => {
      const root = await CircularReferenceModel.create({})
      const level1 = await CircularReferenceModel.create({ parent: root })
      const level2 = await CircularReferenceModel.create({ parent: level1 })
      await CircularReferenceModel.create({ parent: level2 })

      await root.destroy()

      expect(await CircularReferenceModel.count()).toEqual(0)
    })

    it('destroys a chain of depth 6 (beyond the preload depth of 4)', async () => {
      const root = await CircularReferenceModel.create({})
      const level1 = await CircularReferenceModel.create({ parent: root })
      const level2 = await CircularReferenceModel.create({ parent: level1 })
      const level3 = await CircularReferenceModel.create({ parent: level2 })
      const level4 = await CircularReferenceModel.create({ parent: level3 })
      await CircularReferenceModel.create({ parent: level4 })

      await root.destroy()

      expect(await CircularReferenceModel.count()).toEqual(0)
    })

    it('destroys a chain of depth 8 (well beyond the preload depth of 4)', async () => {
      const root = await CircularReferenceModel.create({})
      let current = root
      for (let i = 0; i < 7; i++) {
        current = await CircularReferenceModel.create({ parent: current })
      }

      expect(await CircularReferenceModel.count()).toEqual(8)
      await root.destroy()
      expect(await CircularReferenceModel.count()).toEqual(0)
    })
  })

  context('mutually-referential cycle (ModelA ↔ ModelB)', () => {
    it('destroys a ModelA → ModelB chain', async () => {
      const modelA = await CircularReferenceModelA.create({})
      await CircularReferenceModelB.create({ modelAParent: modelA })

      await modelA.destroy()

      expect(await CircularReferenceModelA.removeAllDefaultScopes().count()).toEqual(0)
      expect(await CircularReferenceModelB.removeAllDefaultScopes().count()).toEqual(0)
    })

    it('destroys a ModelA → ModelB → ModelA → ModelB chain (depth 4)', async () => {
      const a1 = await CircularReferenceModelA.create({})
      const b1 = await CircularReferenceModelB.create({ modelAParent: a1 })
      const a2 = await CircularReferenceModelA.create({ modelBParent: b1 })
      await CircularReferenceModelB.create({ modelAParent: a2 })

      await a1.destroy()

      expect(await CircularReferenceModelA.removeAllDefaultScopes().count()).toEqual(0)
      expect(await CircularReferenceModelB.removeAllDefaultScopes().count()).toEqual(0)
    })

    it('destroys an A → B → A → B → A → B chain (depth 6, beyond preload depth)', async () => {
      const a1 = await CircularReferenceModelA.create({})
      const b1 = await CircularReferenceModelB.create({ modelAParent: a1 })
      const a2 = await CircularReferenceModelA.create({ modelBParent: b1 })
      const b2 = await CircularReferenceModelB.create({ modelAParent: a2 })
      const a3 = await CircularReferenceModelA.create({ modelBParent: b2 })
      await CircularReferenceModelB.create({ modelAParent: a3 })

      await a1.destroy()

      expect(await CircularReferenceModelA.removeAllDefaultScopes().count()).toEqual(0)
      expect(await CircularReferenceModelB.removeAllDefaultScopes().count()).toEqual(0)
    })
  })
})
