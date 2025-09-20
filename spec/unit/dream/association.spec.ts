import MissingRequiredAssociationAndClause from '../../../src/errors/associations/MissingRequiredAssociationAndClause.js'
import MissingRequiredPassthroughForAssociationAndClause from '../../../src/errors/associations/MissingRequiredPassthroughForAssociationAndClause.js'
import Composition from '../../../test-app/app/models/Composition.js'
import LocalizedText from '../../../test-app/app/models/LocalizedText.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#association', () => {
  context('HasOne/BelongsTo', () => {
    it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
      const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })

      const loadedComposition = await user.association('mainComposition')
      expect(loadedComposition).toMatchDreamModel(composition)
      expect(user.loaded('mainComposition')).toBe(true)
    })

    context('when the association is already loaded', () => {
      it('does not load it again', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true, content: 'original' })
        await composition.query().toKysely('update').set({ content: 'modified' }).execute()
        user.mainComposition = composition

        const loadedComposition = await user.association('mainComposition')
        expect(loadedComposition).toMatchDreamModel(composition)
        expect(loadedComposition!.content).toEqual('original')
      })
    })

    context('when the association has a required "and" clause', () => {
      it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true })
        await LocalizedText.create({ localizable: composition, locale: 'en-US' })
        const deText = await LocalizedText.create({ localizable: composition, locale: 'de-DE' })

        const currentLocalizedText = await composition.association('requiredCurrentLocalizedText', {
          required: { locale: 'de-DE' },
        })
        expect(currentLocalizedText).toMatchDreamModel(deText)
        expect(composition.loaded('requiredCurrentLocalizedText')).toBe(true)
      })

      context('without the required clause', () => {
        it('throws', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
          const composition = await Composition.create({ user, primary: true })

          await expect(composition.association('requiredCurrentLocalizedText' as any)).rejects.toThrow(
            MissingRequiredAssociationAndClause
          )
        })
      })
    })

    context('when the association has a passthrough "and" clause', () => {
      it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true })
        await LocalizedText.create({ localizable: composition, locale: 'en-US' })
        const deText = await LocalizedText.create({ localizable: composition, locale: 'de-DE' })

        const currentLocalizedText = await composition.association('passthroughCurrentLocalizedText', {
          passthrough: { locale: 'de-DE' },
        })
        expect(currentLocalizedText).toMatchDreamModel(deText)
        expect(composition.loaded('passthroughCurrentLocalizedText')).toBe(true)
      })

      context('without the passthrough clause', () => {
        it('throws', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
          const composition = await Composition.create({ user, primary: true })

          await expect(composition.association('passthroughCurrentLocalizedText' as any)).rejects.toThrow(
            MissingRequiredPassthroughForAssociationAndClause
          )
        })
      })
    })

    context('when the association has a passthrough and a required "and" clause', () => {
      it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true })
        await LocalizedText.create({ localizable: composition, locale: 'en-US', name: 'My Composition' })
        const deText = await LocalizedText.create({
          localizable: composition,
          locale: 'de-DE',
          name: 'My Composition',
        })

        const currentLocalizedText = await composition.association(
          'passthroughAndRequiredCurrentLocalizedText',
          { passthrough: { name: 'My Composition' }, required: { locale: 'de-DE' } }
        )
        expect(currentLocalizedText).toMatchDreamModel(deText)
        expect(composition.loaded('passthroughAndRequiredCurrentLocalizedText')).toBe(true)
      })
    })

    context('when there is no associated model', () => {
      it('returns null and sets the association to null on the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

        const loadedComposition = await user.association('mainComposition')
        expect(loadedComposition).toBeNull()
        expect(user.loaded('mainComposition')).toBe(true)
      })

      context('when the association is already loaded', () => {
        it('is null', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
          user.mainComposition = null as unknown as Composition

          const loadedComposition = await user.association('mainComposition')
          expect(loadedComposition).toBeNull()
        })
      })
    })
  })

  context('HasMany', () => {
    it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
      const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
      const composition = await Composition.create({ user, primary: true })

      const compositions = await user.association('compositions')
      expect(compositions).toMatchDreamModels([composition])
      expect(user.loaded('compositions')).toBe(true)
    })

    context('when the association is already loaded', () => {
      it('does not load it again', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        const composition = await Composition.create({ user, primary: true, content: 'original' })
        await composition.query().toKysely('update').set({ content: 'modified' }).execute()
        user.compositions = [composition]

        const compositions = await user.association('compositions')
        expect(compositions).toMatchDreamModels([composition])
        expect(compositions[0]!.content).toEqual('original')
      })
    })

    context('when the association has a required "and" clause', () => {
      it('returns the association and loads it onto the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
        await Pet.create({ user, name: 'Snoopy' })
        const woodstock = await Pet.create({ user, name: 'Woodstock' })

        const pets = await user.association('petsWithRequiredName', {
          required: { name: 'Woodstock' },
        })
        expect(pets).toMatchDreamModels([woodstock])
        expect(user.loaded('petsWithRequiredName')).toBe(true)
      })

      context('without the required clause', () => {
        it('throws', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await expect(user.association('petsWithRequiredName' as any)).rejects.toThrow(
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

        const pets = await user.association('petsWithPassthroughName', {
          passthrough: { name: 'Woodstock' },
        })
        expect(pets).toMatchDreamModels([woodstock])
        expect(user.loaded('petsWithPassthroughName')).toBe(true)
      })

      context('without the passthrough clause', () => {
        it('throws', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

          await expect(user.association('petsWithPassthroughName' as any)).rejects.toThrow(
            MissingRequiredPassthroughForAssociationAndClause
          )
        })
      })
    })

    context('when there is no associated model', () => {
      it('returns null and sets the association to null on the model so it is memoized for future calls', async () => {
        const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })

        const compositions = await user.association('compositions')
        expect(compositions).toEqual([])
        expect(user.loaded('compositions')).toBe(true)
      })

      context('when the association is already loaded', () => {
        it('is an empty array', async () => {
          const user = await User.create({ email: 'charlie@peanuts.com', password: 'howyadoin' })
          user.compositions = []

          const compositions = await user.association('compositions')
          expect(compositions).toEqual([])
        })
      })
    })
  })
})
