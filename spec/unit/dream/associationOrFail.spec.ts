import MissingRequiredAssociationAndClause from '../../../src/errors/associations/MissingRequiredAssociationAndClause.js'
import MissingRequiredPassthroughForAssociationAndClause from '../../../src/errors/associations/MissingRequiredPassthroughForAssociationAndClause.js'
import { RecordNotFound } from '../../../src/index.js'
import ApplicationModel from '../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../test-app/app/models/Composition.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#associationOrFail', () => {
  context('HasOne/BelongsTo', () => {
    it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
      const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })

      const loadedComposition = await user.associationOrFail('mainComposition')
      expect(loadedComposition).toMatchDreamModel(composition)
      expect(user.loaded('mainComposition')).toBe(true)
    })

    context('when the association is already loaded', () => {
      it('does not load it again', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true, content: 'original' })
        await composition.query().toKysely('update').set({ content: 'modified' }).execute()
        user.mainComposition = composition

        const loadedComposition = await user.associationOrFail('mainComposition')
        expect(loadedComposition).toMatchDreamModel(composition)
        expect(loadedComposition.content).toEqual('original')
      })
    })

    context('when there is no associated model', () => {
      it('throws RecordNotFound and sets the association to null on the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

        await expect(user.associationOrFail('mainComposition')).rejects.toThrow(RecordNotFound)
        expect(user.loaded('mainComposition')).toBe(true)
      })

      context('when the association is already loaded', () => {
        it('throws RecordNotFound', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
          user.mainComposition = null as unknown as Composition

          await expect(user.associationOrFail('mainComposition')).rejects.toThrow(RecordNotFound)
        })
      })
    })
  })

  context('HasMany', () => {
    it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
      const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })

      const compositions = await user.associationOrFail('compositions')
      expect(compositions).toMatchDreamModels([composition])
      expect(user.loaded('compositions')).toBe(true)
    })

    context('when the association is already loaded', () => {
      it('does not load it again', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true, content: 'original' })
        await composition.query().toKysely('update').set({ content: 'modified' }).execute()
        user.compositions = [composition]

        const compositions = await user.associationOrFail('compositions')
        expect(compositions).toMatchDreamModels([composition])
        expect(compositions[0]!.content).toEqual('original')
      })
    })

    context('when the association has a required "and" clause', () => {
      it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        await Pet.create({ user, name: 'Snoopy' })
        const woodstock = await Pet.create({ user, name: 'Woodstock' })

        const pets = await user.associationOrFail('petsWithRequiredName', {
          required: { name: 'Woodstock' },
        })
        expect(pets).toMatchDreamModels([woodstock])
        expect(user.loaded('petsWithRequiredName')).toBe(true)
      })

      context('without the required clause', () => {
        it('throws', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await expect(user.associationOrFail('petsWithRequiredName' as any)).rejects.toThrow(
            MissingRequiredAssociationAndClause
          )
        })
      })
    })

    context('when the association has a passthrough "and" clause', () => {
      it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        await Pet.create({ user, name: 'Snoopy' })
        const woodstock = await Pet.create({ user, name: 'Woodstock' })

        const pets = await user.associationOrFail('petsWithPassthroughName', {
          passthrough: { name: 'Woodstock' },
        })

        expect(pets).toMatchDreamModels([woodstock])
        expect(user.loaded('petsWithPassthroughName')).toBe(true)
      })

      context('without the passthrough clause', () => {
        it('throws', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await expect(user.associationOrFail('petsWithPassthroughName' as any)).rejects.toThrow(
            MissingRequiredPassthroughForAssociationAndClause
          )
        })
      })
    })

    context('when there is no associated model', () => {
      it('returns an empty array and sets an empty array on the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

        const compositions = await user.associationOrFail('compositions')
        expect(compositions).toEqual([])
        expect(user.loaded('compositions')).toBe(true)
      })

      context('when the association is already loaded', () => {
        it('is an empty array', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
          user.compositions = []

          const compositions = await user.associationOrFail('compositions')
          expect(compositions).toEqual([])
        })
      })
    })
  })

  context('in a transaction', () => {
    context('HasOne/BelongsTo', () => {
      it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
        let composition: Composition | undefined
        let loadedComposition: Composition | undefined

        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

        await ApplicationModel.transaction(async txn => {
          composition = await Composition.txn(txn).create({ user, primary: true })
          loadedComposition = await user.txn(txn).associationOrFail('mainComposition')
        })

        expect(loadedComposition).toMatchDreamModel(composition)
        expect(user.loaded('mainComposition')).toBe(true)
      })

      context('when the association is already loaded', () => {
        it('does not load it again', async () => {
          let composition: Composition | undefined
          let loadedComposition: Composition | undefined

          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await ApplicationModel.transaction(async txn => {
            composition = await Composition.txn(txn).create({ user, primary: true, content: 'original' })
            await composition.query().txn(txn).toKysely('update').set({ content: 'modified' }).execute()
            user.mainComposition = composition

            loadedComposition = await user.txn(txn).associationOrFail('mainComposition')
          })

          expect(loadedComposition).toMatchDreamModel(composition)
          expect(loadedComposition?.content).toEqual('original')
        })
      })

      context('when there is no associated model', () => {
        it('throws RecordNotFound and sets the association to null on the model so it is memoized for future calls', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await ApplicationModel.transaction(async txn => {
            await expect(user.txn(txn).associationOrFail('mainComposition')).rejects.toThrow(RecordNotFound)
          })

          expect(user.loaded('mainComposition')).toBe(true)
        })

        context('when the association is already loaded', () => {
          it('throws RecordNotFound', async () => {
            const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
            user.mainComposition = null as unknown as Composition

            await ApplicationModel.transaction(async txn => {
              await expect(user.txn(txn).associationOrFail('mainComposition')).rejects.toThrow(RecordNotFound)
            })
          })
        })
      })
    })

    context('HasMany', () => {
      it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
        let composition: Composition | undefined
        let compositions: Composition[] | undefined

        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

        await ApplicationModel.transaction(async txn => {
          composition = await Composition.txn(txn).create({ user, primary: true })
          compositions = await user.txn(txn).associationOrFail('compositions')
        })

        expect(compositions).toMatchDreamModels([composition])
        expect(user.loaded('compositions')).toBe(true)
      })

      context('when the association is already loaded', () => {
        it('does not load it again', async () => {
          let composition: Composition | undefined
          let compositions: Composition[] | undefined

          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await ApplicationModel.transaction(async txn => {
            composition = await Composition.txn(txn).create({ user, primary: true, content: 'original' })
            await composition.query().txn(txn).toKysely('update').set({ content: 'modified' }).execute()
            user.compositions = [composition]

            compositions = await user.associationOrFail('compositions')
          })

          expect(compositions).toMatchDreamModels([composition])
          expect(compositions?.[0]!.content).toEqual('original')
        })
      })

      context('when the association has a required "and" clause', () => {
        it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
          let woodstock: Pet | undefined
          let pets: Pet[] | undefined

          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await ApplicationModel.transaction(async txn => {
            await Pet.txn(txn).create({ user, name: 'Snoopy' })
            woodstock = await Pet.txn(txn).create({ user, name: 'Woodstock' })

            pets = await user.txn(txn).associationOrFail('petsWithRequiredName', {
              required: { name: 'Woodstock' },
            })
          })

          expect(pets).toMatchDreamModels([woodstock])
          expect(user.loaded('petsWithRequiredName')).toBe(true)
        })

        context('without the required clause', () => {
          it('throws', async () => {
            const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

            await ApplicationModel.transaction(async txn => {
              await expect(user.txn(txn).associationOrFail('petsWithRequiredName' as any)).rejects.toThrow(
                MissingRequiredAssociationAndClause
              )
            })
          })
        })
      })

      context('when the association has a passthrough "and" clause', () => {
        it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
          let woodstock: Pet | undefined
          let pets: Pet[] | undefined

          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await ApplicationModel.transaction(async txn => {
            await Pet.txn(txn).create({ user, name: 'Snoopy' })
            woodstock = await Pet.txn(txn).create({ user, name: 'Woodstock' })

            pets = await user.txn(txn).associationOrFail('petsWithPassthroughName', {
              passthrough: { name: 'Woodstock' },
            })
          })

          expect(pets).toMatchDreamModels([woodstock])
          expect(user.loaded('petsWithPassthroughName')).toBe(true)
        })

        context('without the passthrough clause', () => {
          it('throws', async () => {
            const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

            await ApplicationModel.transaction(async txn => {
              await expect(user.txn(txn).associationOrFail('petsWithPassthroughName' as any)).rejects.toThrow(
                MissingRequiredPassthroughForAssociationAndClause
              )
            })
          })
        })
      })

      context('when there is no associated model', () => {
        it('returns an empty array and sets an empty array on the model so it is memoized for future calls', async () => {
          let compositions: Composition[] | undefined

          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await ApplicationModel.transaction(async txn => {
            compositions = await user.txn(txn).associationOrFail('compositions')
          })

          expect(compositions).toEqual([])
          expect(user.loaded('compositions')).toBe(true)
        })

        context('when the association is already loaded', () => {
          it('is an empty array', async () => {
            let compositions: Composition[] | undefined

            const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
            user.compositions = []

            await ApplicationModel.transaction(async txn => {
              compositions = await user.txn(txn).associationOrFail('compositions')
            })

            expect(compositions).toEqual([])
          })
        })
      })
    })
  })
})
