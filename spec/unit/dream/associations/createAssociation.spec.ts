import CannotCreateAssociationOnUnpersistedDream from '../../../../src/errors/associations/CannotCreateAssociationOnUnpersistedDream.js'
import CannotCreateAssociationWithThroughContext from '../../../../src/errors/associations/CannotCreateAssociationWithThroughContext.js'
import { DateTime } from '../../../../src/index.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import Post from '../../../../test-app/app/models/Post.js'
import PostVisibility from '../../../../test-app/app/models/PostVisibility.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream#createAssociation', () => {
  context('with a HasMany association', () => {
    it('creates the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const composition = await user.createAssociation('compositions', { createdAt: createdAt })

      expect(composition.createdAt).toEqual(createdAt.toUTC())
      expect(await user.associationQuery('compositions').all()).toMatchDreamModels([composition])
    })

    context('with a primary key override on the association', () => {
      it('creates the related association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const pet = await user.createAssociation('petsFromUuid', { name: 'Aster' })

        expect(pet.name).toEqual('Aster')
        expect(await user.associationQuery('petsFromUuid').all()).toMatchDreamModels([pet])
      })
    })
  })

  context('with a HasMany through association', () => {
    it('raises a targeted exception, alerting the user to their mistake', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await expect(user.createAssociation('compositionAssets', {})).rejects.toThrow(
        CannotCreateAssociationWithThroughContext
      )
    })
  })

  context('with a HasOne association', () => {
    it('creates the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const userSettings = await user.createAssociation('userSettings', { createdAt })

      expect(userSettings.createdAt).toEqual(createdAt.toUTC())
      expect(await user.associationQuery('userSettings').all()).toMatchDreamModels([userSettings])
    })

    context('with a primary key override on the association', () => {
      it('creates the related association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const pet = await user.createAssociation('firstPetFromUuid', { name: 'Aster' })

        expect(pet.name).toEqual('Aster')
        expect(await user.associationQuery('firstPetFromUuid').all()).toMatchDreamModels([pet])
      })
    })
  })

  context('with a HasOne through association', () => {
    it('raises a targeted exception, alerting the user to their mistake', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await expect(user.createAssociation('mainCompositionAsset', {})).rejects.toThrow(
        CannotCreateAssociationWithThroughContext
      )
    })
  })

  context('with an optional BelongsTo association', () => {
    it('creates the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user, body: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })
      const postVisibility = await post.createAssociation('postVisibility', { createdAt: createdAt })

      expect(postVisibility.createdAt).toEqual(createdAt.toUTC())
      expect(await post.associationQuery('postVisibility').first()).toMatchDreamModel(postVisibility)
    })

    context('with a primary key override on the association', () => {
      it('creates the related association', async () => {
        const pet = await Pet.create({ name: 'Aster' })
        const user = await pet.createAssociation('userThroughUuid', {
          email: 'fred@fred',
          password: 'howyadoin',
        })

        expect(pet.name).toEqual('Aster')
        expect(await pet.associationQuery('userThroughUuid').all()).toMatchDreamModels([user])
      })
    })
  })

  context('with a polymorphic association', () => {
    it('assigns class name of base model to polymorphic type field', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const post = await Post.create({ user, body: 'howyadoin' })
      const rating = await post.createAssociation('ratings', { body: 'my rating', user })
      expect(rating.rateableType).toEqual('Post')
    })

    context('when the polymorphic association is passed as an argument', () => {
      it('assigns class name of base model to polymorphic type field', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({ user })

        const rating = await user.createAssociation('ratings', { rateable: composition })
        expect(rating.rateableType).toEqual('Composition')
      })
    })

    context('when the model being assined is an STI child', () => {
      it('assigns class name of base STI model to polymorphic type field', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const mylarBalloon = await Mylar.create()
        const rating = await mylarBalloon.createAssociation('heartRatings', { rating: 3, user })
        expect(rating.extraRateableType).toEqual('Balloon')
      })

      context('when the polymorphic association is passed as an argument', () => {
        it('assigns class name of base STI model to polymorphic type field', async () => {
          const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

          const mylarBalloon = await Mylar.create()
          const rating = await user.createAssociation('heartRatings', {
            rating: 3,
            extraRateable: mylarBalloon,
          })
          expect(rating.extraRateableType).toEqual('Balloon')
        })
      })
    })
  })

  context('when in a transaction', () => {
    it('creates the related association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const createdAt = DateTime.now().minus({ days: 1 })

      await ApplicationModel.transaction(async txn => {
        const composition = await user.txn(txn).createAssociation('compositions', { createdAt: createdAt })

        expect(composition.createdAt).toEqual(createdAt.toUTC())
        expect(await user.txn(txn).associationQuery('compositions').all()).toMatchDreamModels([composition])
      })
    })

    context('with a primary key override', () => {
      it('creates the related association', async () => {
        let pet: Pet | undefined = undefined
        let user: User | undefined = undefined
        await ApplicationModel.transaction(async txn => {
          pet = await Pet.txn(txn).create({ name: 'Aster' })
          user = await pet.txn(txn).createAssociation('userThroughUuid', {
            email: 'fred@fred',
            password: 'howyadoin',
          })
        })

        expect(pet!.name).toEqual('Aster')
        expect(await pet!.associationQuery('userThroughUuid').all()).toMatchDreamModels([user])
      })
    })

    context('with an optional BelongsTo association', () => {
      it('creates the related association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const post = await Post.create({ user, body: 'howyadoin' })
        const createdAt = DateTime.now().minus({ days: 1 })

        await ApplicationModel.transaction(async txn => {
          const postVisibility = await post
            .txn(txn)
            .createAssociation('postVisibility', { createdAt: createdAt })

          expect(postVisibility.createdAt).toEqual(createdAt.toUTC())
          expect(await PostVisibility.txn(txn).count()).toEqual(1)
          expect(await post.txn(txn).associationQuery('postVisibility').first()).toMatchDreamModel(
            postVisibility
          )
        })
      })
    })
  })

  context('performing updateAssociation on an unpersisted model ', () => {
    it('throws CannotCreateAssociationOnUnpersistedDream', async () => {
      const user = User.new()

      await expect(user.createAssociation('pets', {})).rejects.toThrow(
        CannotCreateAssociationOnUnpersistedDream
      )
    })

    context('in a transaction', () => {
      it('throws CannotCreateAssociationOnUnpersistedDream', async () => {
        const user = User.new()

        await expect(
          ApplicationModel.transaction(async txn => await user.txn(txn).createAssociation('pets', {}))
        ).rejects.toThrow(CannotCreateAssociationOnUnpersistedDream)
      })
    })
  })
})
