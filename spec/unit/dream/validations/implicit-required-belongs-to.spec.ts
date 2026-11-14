import STI from '../../../../src/decorators/class/STI.js'
import Decorators from '../../../../src/decorators/Decorators.js'
import ValidationError from '../../../../src/errors/ValidationError.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

describe('associated BelongsTo models', () => {
  it('are required', async () => {
    await User.create({ email: 'fred@frewd', password: 'howadoin' })
    const composition = Composition.new({ content: 'Aster is the Flufflord: a philosophic approach' })

    await expect(composition.save()).rejects.toThrow(ValidationError)

    expect(composition.errors).toMatchObject({ user: ['requiredBelongsTo'] })
  })

  context('when optional', () => {
    it('are not required', async () => {
      const pet = Pet.new({ name: 'Aster' })
      await pet.save()
      const reloadedPet = await Pet.find(pet.id)
      expect(reloadedPet!.name).toEqual('Aster')
    })
  })

  context('when declared on an STI base', () => {
    it('are required once on an STI child initialized before its base', () => {
      const deco = new Decorators<typeof OwnedBase>()

      class OwnedBase extends ApplicationModel {
        public override get table() {
          return 'sti_bases' as const
        }

        public id: DreamColumn<OwnedBase, 'id'>

        @deco.Validates('presence')
        public name: DreamColumn<OwnedBase, 'name'>

        @deco.BelongsTo('Pet', { on: 'petId' })
        public pet: Pet
        public petId: DreamColumn<OwnedBase, 'petId'>
      }

      @STI(OwnedBase)
      class OwnedChild extends OwnedBase {}

      processDynamicallyDefinedModels(OwnedChild, OwnedBase)

      const child = OwnedChild.new({})
      expect(child.isInvalid).toBe(true)
      expect(child.errors).toEqual({ name: ['presence'], pet: ['requiredBelongsTo'] })
    })

    it('are required once on an STI child initialized after its base', () => {
      const deco = new Decorators<typeof OwnedBase>()

      class OwnedBase extends ApplicationModel {
        public override get table() {
          return 'sti_bases' as const
        }

        public id: DreamColumn<OwnedBase, 'id'>

        @deco.Validates('presence')
        public name: DreamColumn<OwnedBase, 'name'>

        @deco.BelongsTo('Pet', { on: 'petId' })
        public pet: Pet
        public petId: DreamColumn<OwnedBase, 'petId'>
      }

      @STI(OwnedBase)
      class OwnedChild extends OwnedBase {}

      processDynamicallyDefinedModels(OwnedBase, OwnedChild)

      const child = OwnedChild.new({})
      expect(child.isInvalid).toBe(true)
      expect(child.errors).toEqual({ name: ['presence'], pet: ['requiredBelongsTo'] })
    })
  })
})
