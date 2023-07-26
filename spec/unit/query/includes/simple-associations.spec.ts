import User from '../../../../test-app/app/models/User'
import Composition from '../../../../test-app/app/models/Composition'
import CompositionAsset from '../../../../test-app/app/models/CompositionAsset'
import CompositionAssetAudit from '../../../../test-app/app/models/CompositionAssetAudit'
import IncompatibleForeignKeyTypeExample from '../../../../test-app/app/models/IncompatibleForeignKeyTypeExample'
import ForeignKeyOnAssociationDoesNotMatchPrimaryKeyOnBase from '../../../../src/exceptions/foreign-key-on-association-does-not-match-primary-key-on-base'
import { DateTime } from 'luxon'
import Pet from '../../../../test-app/app/models/Pet'
import Query from '../../../../src/dream/query'
import Latex from '../../../../test-app/app/models/Balloon/Latex'
import BalloonLine from '../../../../test-app/app/models/BalloonLine'
import Balloon from '../../../../test-app/app/models/Balloon'
import WellnessTag from '../../../../test-app/app/models/WellnessTag'
import FoodItem from '../../../../test-app/app/models/FoodItem'
import FoodItemWellnessTag from '../../../../test-app/app/models/FoodItemWellnessTag'
import { getTokenSourceMapRange } from 'typescript'

describe('Query#includes with simple associations', () => {
  context('HasOne', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition = await Composition.create({ user_id: user.id, primary: true })

      const reloadedUser = await new Query(User).includes('mainComposition').first()
      expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    })

    context('when the association does not exist', () => {
      it('sets it to null', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await new Query(User).includes('mainComposition').first()
        expect(reloadedUser!.mainComposition).toBeNull()
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const balloon = await Latex.create({ color: 'blue' })
        const line = await BalloonLine.create({ balloon, material: 'ribbon' })

        const reloaded = await new Query(Balloon).includes('balloonLine').first()
        expect(reloaded!.balloonLine).toMatchDreamModel(line)
      })
    })

    context('with primary key specified', () => {
      it('loads the association', async () => {
        const wellnessTag = await WellnessTag.create({ name: 'Atkins 40' })
        const foodItem = await FoodItem.create({
          name: 'Tuscan Chalupa',
          calories: 50000000,
          external_nutrition_id: 'abc123',
        })
        const foodItemWellnessTag = await FoodItemWellnessTag.create({
          external_nutrition_id: 'abc123',
          wellnessTag,
          primary: true,
        })

        const reloaded = await new Query(FoodItem).includes('primaryFoodItemWellnessTag').first()
        expect(reloaded!.primaryFoodItemWellnessTag).toMatchDreamModel(foodItemWellnessTag)
      })
    })
  })

  context('HasMany', () => {
    it('loads the associations', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const composition1 = await Composition.create({ user_id: user.id })
      const composition2 = await Composition.create({ user_id: user.id })

      const reloadedUser = await new Query(User).includes('compositions').first()
      expect(reloadedUser!.compositions).toMatchDreamModels([composition1, composition2])
    })

    context('when no association exists', () => {
      it('sets it to an empty array', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

        const reloadedUser = await new Query(User).includes('compositions').first()
        expect(reloadedUser!.compositions).toEqual([])
      })
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const balloon = await Latex.create({ user, color: 'blue' })

        const reloadedUser = await new Query(User).includes('balloons').first()
        expect(reloadedUser!.balloons).toMatchDreamModels([balloon])
      })
    })

    context('with primary key specified', () => {
      it('loads the association', async () => {
        const wellnessTag = await WellnessTag.create({ name: 'Atkins 40' })
        const foodItem = await FoodItem.create({
          name: 'Tuscan Chalupa',
          calories: 50000000,
          external_nutrition_id: 'abc123',
        })
        const foodItemWellnessTag = await FoodItemWellnessTag.create({
          external_nutrition_id: 'abc123',
          wellnessTag,
        })

        const reloaded = await new Query(FoodItem).includes('foodItemWellnessTags').first()
        expect(reloaded!.foodItemWellnessTags).toMatchDreamModels([foodItemWellnessTag])
      })
    })
  })

  context('when there are HasMany results', () => {
    it('sets the association to an empty array', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })

      const reloadedUser = await new Query(User).includes('compositions').first()
      expect(reloadedUser!.compositions).toEqual([])
    })
  })

  context('BelongsTo', () => {
    it('loads the association', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await Composition.create({ user_id: user.id })
      const reloadedComposition = await new Query(Composition).includes('user').first()
      expect(reloadedComposition!.user).toMatchDreamModel(user)
    })

    context('pointing to an STI model', () => {
      it('loads the association', async () => {
        const balloon = await Latex.create({ color: 'blue' })
        const line = await BalloonLine.create({ balloon, material: 'ribbon' })

        const reloaded = await new Query(BalloonLine).includes('balloon').first()
        expect(reloaded!.balloon).toMatchDreamModel(balloon)
      })
    })

    context('with primary key specified', () => {
      it('loads the association', async () => {
        const wellnessTag = await WellnessTag.create({ name: 'Atkins 40' })
        const foodItem = await FoodItem.create({
          name: 'Tuscan Chalupa',
          calories: 50000000,
          external_nutrition_id: 'abc123',
        })
        const foodItemWellnessTag = await FoodItemWellnessTag.create({
          external_nutrition_id: 'abc123',
          wellnessTag,
          primary: true,
        })

        const reloaded = await new Query(FoodItemWellnessTag).includes('foodItem').first()
        expect(reloaded!.foodItem).toMatchDreamModel(foodItem)
      })
    })
  })

  it('can handle object notation', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    const reloaded = await new Query(User).includes({ compositions: 'compositionAssets' }).first()
    expect(reloaded!.compositions).toMatchDreamModels([composition])
    expect(reloaded!.compositions[0].compositionAssets).toMatchDreamModels([compositionAsset])
  })

  it('can handle array notation', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id, primary: true })
    const composition2 = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })

    const reloadedUser = await new Query(User)
      .includes(['compositions', { mainComposition: ['compositionAssets'] }])
      .first()

    expect(reloadedUser!.mainComposition).toMatchDreamModel(composition)
    expect(reloadedUser!.compositions).toMatchDreamModels([composition, composition2])
    expect(reloadedUser!.mainComposition.compositionAssets).toMatchDreamModels([compositionAsset])
  })

  it('can sideload multiple associations at once', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const composition = await Composition.create({ user_id: user.id })
    const compositionAsset = await CompositionAsset.create({ composition_id: composition.id })
    const compositionAssetAudit = await CompositionAssetAudit.create({
      composition_asset_id: compositionAsset.id,
    })

    const reloaded = await new Query(CompositionAssetAudit).includes('composition', 'user').first()
    expect(reloaded!.composition).toMatchDreamModel(composition)
    expect(reloaded!.user).toMatchDreamModel(user)
  })

  context('HasMany', () => {
    context('with matching where-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({
          user,
          created_at: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await new Query(User).includes('recentCompositions').first()
        expect(reloadedUser!.recentCompositions).toMatchDreamModels([composition])
      })
    })

    context('with NON-matching where-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          created_at: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await new Query(User).includes('recentCompositions').first()
        expect(reloadedUser!.recentCompositions).toEqual([])
      })
    })

    context('with matching whereNot-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        await Composition.create({
          user,
          created_at: DateTime.now().minus({ day: 1 }),
        })

        const reloadedUser = await new Query(User).includes('notRecentCompositions').first()
        expect(reloadedUser!.notRecentCompositions).toEqual([])
      })
    })

    context('with NON-matching whereNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
        const composition = await Composition.create({
          user,
          created_at: DateTime.now().minus({ year: 1 }),
        })

        const reloadedUser = await new Query(User).includes('notRecentCompositions').first()
        expect(reloadedUser!.notRecentCompositions).toMatchDreamModels([composition])
      })
    })
  })

  context('HasOne', () => {
    context('with matching where-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        const lostCollar = await pet.createAssociation('collars', {
          lost: true,
        })
        const currentCollar = await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.includes('currentCollar').first()
        expect(reloaded?.currentCollar).toMatchDreamModel(currentCollar)
      })
    })

    context('with NON-matching where-clause-on-the-association', () => {
      it('does not load the object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.includes('currentCollar').first()
        expect(reloaded?.currentCollar).toBeNull()
      })
    })

    context('with matching whereNot-clause-on-the-association', () => {
      it('does not load the associated object', async () => {
        const pet = await Pet.create()
        await pet.createAssociation('collars', {
          lost: true,
        })

        const reloaded = await Pet.includes('notLostCollar').first()
        expect(reloaded?.notLostCollar).toBeNull()
      })
    })

    context('with NON-matching whereNot-clause-on-the-association', () => {
      it('loads the associated object', async () => {
        const pet = await Pet.create()
        const notLostCollar = await pet.createAssociation('collars', {
          lost: false,
        })

        const reloaded = await Pet.includes('notLostCollar').first()
        expect(reloaded?.notLostCollar).toMatchDreamModel(notLostCollar)
      })
    })
  })

  context('when an association has a mismatched type on the foreign key', () => {
    it('throws an exception alerting the user to the mismatched types', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      await IncompatibleForeignKeyTypeExample.create({ user })

      let error: Error | null = null
      try {
        await new Query(User).includes('incompatibleForeignKeyTypeExamples').all()
      } catch (err: any) {
        error = err
      }
      expect(error!.constructor).toEqual(ForeignKeyOnAssociationDoesNotMatchPrimaryKeyOnBase)
    })
  })

  context('default scopes on the included models', () => {
    it('applies the default scope to the included models', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const snoopy = await Pet.create({ user, name: 'Snoopy' })
      await Pet.create({ user, name: 'Woodstock', deleted_at: DateTime.now() })
      const reloadedUser = await User.where({ email: user.email }).includes('pets').first()
      expect(reloadedUser!.pets).toMatchDreamModels([snoopy])
    })
  })
})
