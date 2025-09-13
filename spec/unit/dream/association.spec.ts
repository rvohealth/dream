import Composition from '../../../test-app/app/models/Composition.js'
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
