import ops from '../../../src/ops.js'
import Latex from '../../../test-app/app/models/Balloon/Latex.js'
import Node from '../../../test-app/app/models/Graph/Node.js'
import Pet from '../../../test-app/app/models/Pet.js'
import PetUnderstudyJoinModel from '../../../test-app/app/models/PetUnderstudyJoinModel.js'

describe('Dream.distinct', () => {
  it('returns unique results distinct on the primary key', async () => {
    const node1 = await Node.create({ name: 'mynode' })
    const node2 = await Node.create({ name: 'mynode' })
    const node3 = await Node.create({ name: 'chalupas' })

    const ids = await Node.distinct().pluck('id')
    expect(ids).toEqual([node1.id, node2.id, node3.id])
  })

  context('with a specific column name passed', () => {
    it('returns unique results', async () => {
      await Node.create({ name: 'mynode' })
      await Node.create({ name: 'mynode' })
      await Node.create({ name: 'chalupas' })

      const names = await Node.distinct('name').pluck('name')
      expect(names).toEqual(['chalupas', 'mynode'])
    })
  })

  context('with "true" passed', () => {
    it('returns unique results distinct on the primary key', async () => {
      const node1 = await Node.create({ name: 'mynode' })
      const node2 = await Node.create({ name: 'mynode' })
      const node3 = await Node.create({ name: 'chalupas' })

      const ids = await Node.distinct(true).pluck('id')
      expect(ids).toEqual([node1.id, node2.id, node3.id])
    })
  })

  context('with "false" passed', () => {
    it('unsets distinct clause', async () => {
      await Node.create({ name: 'mynode' })
      await Node.create({ name: 'mynode' })
      await Node.create({ name: 'chalupas' })

      const names = await Node.distinct('name').distinct(false).pluck('name')
      expect(names).toEqual(['mynode', 'mynode', 'chalupas'])
    })
  })

  context('with a similarity operator passed', () => {
    it('respects the similarity operator', async () => {
      const node1 = await Node.create({ name: 'mynode' })
      await Node.create({ name: 'mynode' })
      await Node.create({ name: 'chalupas' })

      const ids = await Node.distinct('name')
        .where({ name: ops.similarity('mynod') })
        .order({ name: 'desc' })
        .pluck('id')
      expect(ids).toEqual([node1.id])
    })
  })

  context('with matching distinct-clause-on-the-association', () => {
    context('preloading', () => {
      context('HasMany', () => {
        it('applies distinct clause to association upon loading', async () => {
          const pet = await Pet.create()
          const collar1 = await pet.createAssociation('collars', {
            tagName: 'chalupas jr',
          })
          await pet.createAssociation('collars', {
            tagName: 'chalupas jr',
          })

          const reloaded = await Pet.preload('uniqueCollars').first()
          expect(reloaded!.uniqueCollars).toMatchDreamModels([collar1])
        })
      })

      context('HasMany through', () => {
        it('applies distinct clause to association upon loading', async () => {
          const pet = await Pet.create()
          const balloon = await Latex.create()
          await pet.createAssociation('collars', {
            tagName: 'chalupas jr',
            balloon,
          })
          await pet.createAssociation('collars', {
            tagName: 'chalupas jr',
            balloon,
          })

          const reloaded = await Pet.preload('uniqueBalloons').first()
          expect(reloaded!.uniqueBalloons).toMatchDreamModels([balloon])
        })
      })

      context('HasMany through with a distinct clause applied on the outer association', () => {
        it('applies distinct clause to association upon loading', async () => {
          const pet = await Pet.create()
          const balloon = await Latex.create()
          await pet.createAssociation('collars', {
            balloon,
          })
          await pet.createAssociation('collars', {
            balloon,
          })

          const reloaded = await Pet.preload('distinctBalloons').first()
          expect(reloaded?.distinctBalloons).toMatchDreamModels([balloon])
        })

        context('when the association name is aliased', () => {
          it('applies distinct clause to association upon loading', async () => {
            const pet = await Pet.create()
            const balloon = await Latex.create()
            await pet.createAssociation('collars', {
              balloon,
            })
            await pet.createAssociation('collars', {
              balloon,
            })

            const reloaded = await Pet.preload('distinctBalloons as db').first()
            expect(reloaded?.distinctBalloons).toMatchDreamModels([balloon])
          })
        })
      })
    })

    context('joins', () => {
      context('HasMany', () => {
        it('applies distinct clause to association upon loading', async () => {
          const pet = await Pet.create()
          const collar1 = await pet.createAssociation('collars', {
            tagName: 'chalupas jr',
          })
          const collar2 = await pet.createAssociation('collars', {
            tagName: 'chalupas jr',
          })

          const ids = await Pet.query().innerJoin('uniqueCollars').pluck('uniqueCollars.id')
          expect(ids.length).toEqual(1)
          expect([collar1.id, collar2.id].includes(ids[0])).toBe(true)
        })
      })

      context('HasMany through a distinct HasMany association', () => {
        it('applies distinct clause to association upon loading', async () => {
          const pet = await Pet.create()
          const balloon = await Latex.create()
          await pet.createAssociation('collars', {
            tagName: 'chalupas jr',
            balloon,
          })
          await pet.createAssociation('collars', {
            tagName: 'chalupas jr',
            balloon,
          })

          const ids = await Pet.query().innerJoin('uniqueBalloons').pluck('uniqueBalloons.id')
          expect(ids).toEqual([balloon.id])
        })
      })

      context('HasMany through with a distinct clause applied on the implicit association', () => {
        it('applies distinct clause to association upon loading', async () => {
          const pet = await Pet.create()
          const balloon = await Latex.create()
          await pet.createAssociation('collars', {
            balloon,
          })
          await pet.createAssociation('collars', {
            balloon,
          })

          const ids = await Pet.query().innerJoin('distinctBalloons').pluck('distinctBalloons.id')
          expect(ids).toEqual([balloon.id])
        })

        context(
          'Replicating bug caused by HasMany through join model pointing back to original model again',
          () => {
            it('applies distinct clause to association upon loading', async () => {
              const pet1 = await Pet.create({ name: 'pet1' })
              const pet2 = await Pet.create({ name: 'pet2' })
              const understudy = await Pet.create({ name: 'understudy1' })
              await PetUnderstudyJoinModel.create({
                pet: pet1,
                understudy,
              })
              await PetUnderstudyJoinModel.create({
                pet: pet2,
                understudy,
              })

              const ids = await Pet.query().innerJoin('understudies').pluck('understudies.id')
              expect(ids).toEqual([understudy.id])
            })
          }
        )
      })
    })
  })
})
