import Decorators from '../../../../src/decorators/Decorators.js'
import STI from '../../../../src/decorators/class/STI.js'
import sqlResultToDreamInstance, {
  findExtendingDreamClass,
} from '../../../../src/dream/internal/sqlResultToDreamInstance.js'
import StiChildCannotDeclareJSONColumnShape from '../../../../src/errors/sti/StiChildCannotDeclareJSONColumnShape.js'
import StiChildCannotDeclareSortable from '../../../../src/errors/sti/StiChildCannotDeclareSortable.js'
import StiChildCannotDefineNewAssociations from '../../../../src/errors/sti/StiChildCannotDefineNewAssociations.js'
import STIChildMissing from '../../../../src/errors/sti/STIChildMissing.js'
import STIChildTypeMismatch from '../../../../src/errors/sti/STIChildTypeMismatch.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Animal from '../../../../test-app/app/models/Balloon/Latex/Animal.js'
import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import StiBase from '../../../../test-app/app/models/Sti/Base.js'
import User from '../../../../test-app/app/models/User.js'

describe('Dream STI', () => {
  let user: User | null = null

  beforeEach(async () => {
    user = await User.create({ email: 'fred@fred', password: 'howyadoin' })
  })

  describe('.isSTIBase', () => {
    context('when the model is not extended', () => {
      it('is false', () => {
        expect(User['isSTIBase']).toBe(false)
      })
    })

    context('when the model is extended', () => {
      it('is true', () => {
        expect(Balloon['isSTIBase']).toBe(true)
      })
    })

    context('when the model is extended, but also extends a Dream model', () => {
      it('is false', () => {
        expect(Latex['isSTIBase']).toBe(false)
      })
    })
  })

  describe('.isSTIChild', () => {
    context('when the model is not STI', () => {
      it('is false', () => {
        expect(User['isSTIChild']).toBe(false)
      })
    })

    context('when the model is extended', () => {
      it('is true', () => {
        expect(Balloon['isSTIChild']).toBe(false)
      })
    })

    context('when the model extends a Dream model', () => {
      it('is true', () => {
        expect(Mylar['isSTIChild']).toBe(true)
      })
    })

    context('when the model is extended, but also extends a Dream model', () => {
      it('is false', () => {
        expect(Latex['isSTIChild']).toBe(true)
      })
    })
  })

  describe('.sti.baseClass', () => {
    context('when the model is not STI', () => {
      it('is null', () => {
        expect(User['sti'].baseClass).toBeNull()
      })
    })

    context('when the model is an STI base class', () => {
      it('is null', () => {
        expect(Balloon['sti'].baseClass).toBeNull()
      })
    })

    context('when the model extends a Dream model', () => {
      it('is the base class extended by this Dream model', () => {
        expect(Mylar['sti'].baseClass).toEqual(Balloon)
      })
    })

    context('when the model is extended, but also extends a Dream model', () => {
      it('is the base class extended by this Dream model', () => {
        expect(Latex['sti'].baseClass).toEqual(Balloon)
      })
    })

    context('when the model extends a class that itself extends a class', () => {
      it('is the base class extended by this Dream model', () => {
        expect(Animal['sti'].baseClass).toEqual(Balloon)
      })
    })
  })

  it('builds scope mapping', () => {
    expect(Balloon['sti'].value).toBeNull()

    expect(Mylar['sti'].value).toEqual('Mylar')
    expect(Latex['sti'].value).toEqual('Latex')
  })

  it('auto-applies the type field for STI classes upon insertion', async () => {
    const mylarBalloon = await Mylar.create({
      user: user!,
      color: 'blue',
    })
    expect(mylarBalloon.type).toEqual('Mylar')
  })

  it('auto-applies a default scope for classes implementing STI', async () => {
    const mylarBalloon = await Mylar.create({
      user: user!,
      color: 'blue',
    })
    await Latex.create({
      user: user!,
      color: 'red',
    })

    const balloons = await Mylar.all()
    expect(balloons).toMatchDreamModels([mylarBalloon])

    const balloon = await Mylar.first()
    expect(balloon).toMatchDreamModel(mylarBalloon)
  })

  context('STI extending an STI model', () => {
    it('applies the default scope one time (spec added when the sql included the type clause twice)', async () => {
      await Animal.create({
        user: user!,
        color: 'blue',
      })

      const sql = Animal.query().sql().sql
      expect([...sql.matchAll(/"beautiful_balloons"\."type" = \$/g)].length).toEqual(1)
    })

    it('querying the base class instantiates the second order STI model', async () => {
      const animal = await Animal.create({
        user: user!,
        color: 'blue',
      })

      const balloons = await Balloon.all()
      expect(balloons).toMatchDreamModels([animal])

      const balloon = await Balloon.first()
      expect(balloon).toMatchDreamModel(animal)
    })
  })

  it('correctly marshals each association to its respective dream class based on type', async () => {
    const mylar = await Mylar.create({ user: user!, color: 'red' })
    const latex = await Latex.create({ user: user!, color: 'blue' })

    const balloons = await Balloon.all()
    expect(balloons).toMatchDreamModels([mylar, latex])

    const balloon = await Balloon.first()
    expect(balloon).toMatchDreamModel(mylar)
  })

  context('when an STI child defines a new association', () => {
    it('raises a targeted exception during class decoration', () => {
      class DynamicStiBase extends StiBase {}

      const deco = new Decorators<any>()

      expect(() => {
        @STI(DynamicStiBase)
        class InvalidStiChildAssociation extends DynamicStiBase {
          @deco.BelongsTo('Pet', { on: 'petId' })
          public invalidPet: Pet
        }

        void InvalidStiChildAssociation
      }).toThrow(StiChildCannotDefineNewAssociations)
    })

    it('inherits base association metadata without owning a child fork', () => {
      expect(() => processDynamicallyDefinedModels(Latex, Balloon)).not.toThrow()
      expect(Object.getOwnPropertyDescriptor(Latex, 'associationMetadataByType')).toBeUndefined()
      expect(Latex['associationMetadataByType']).toBe(Balloon['associationMetadataByType'])
    })
  })

  context('when an STI child declares @deco.JSON', () => {
    it('throws during class decoration, naming the child, the column and the base', () => {
      class JsonStiBase extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }
      }

      const defineChild = () => {
        const deco = new Decorators<typeof InvalidJsonStiChild>()

        @STI(JsonStiBase)
        class InvalidJsonStiChild extends JsonStiBase {
          @deco.JSON({ type: 'object', properties: { hello: 'string' } })
          public jsonbData: DreamColumn<InvalidJsonStiChild, 'jsonbData'>
        }

        return InvalidJsonStiChild
      }

      expect(defineChild).toThrow(StiChildCannotDeclareJSONColumnShape)
      expect(defineChild).toThrow(
        /STI child class: InvalidJsonStiChild\nColumn: jsonbData\nSTI base class: JsonStiBase[\s\S]*Move @deco.JSON for jsonbData\nto the STI base class, JsonStiBase/
      )
    })
  })

  context('when an STI base declares @deco.JSON', () => {
    const shape = { type: 'object', properties: { hello: 'string' } } as const

    function defineJsonStiModels() {
      const deco = new Decorators<typeof JsonStiBase>()

      class JsonStiBase extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON(shape)
        public jsonbData: DreamColumn<JsonStiBase, 'jsonbData'>
      }

      @STI(JsonStiBase)
      class JsonStiChild extends JsonStiBase {}

      return { JsonStiBase, JsonStiChild }
    }

    it('gives the base and the child the base’s declaration', () => {
      const { JsonStiBase, JsonStiChild } = defineJsonStiModels()
      processDynamicallyDefinedModels(JsonStiBase, JsonStiChild)

      expect(JsonStiBase['jsonColumnShapes']).toEqual([{ column: 'jsonbData', openapi: shape }])
      expect(JsonStiChild['jsonColumnShapes']).toEqual([{ column: 'jsonbData', openapi: shape }])
      expect(JsonStiChild.isVirtualColumn('jsonbData')).toBe(false)
    })

    it('gives the child the base’s declaration when the child is initialized first', () => {
      const { JsonStiBase, JsonStiChild } = defineJsonStiModels()
      processDynamicallyDefinedModels(JsonStiChild, JsonStiBase)

      expect(JsonStiChild['jsonColumnShapes']).toEqual([{ column: 'jsonbData', openapi: shape }])
      expect(JsonStiBase['jsonColumnShapes']).toEqual([{ column: 'jsonbData', openapi: shape }])
    })
  })

  context('when an STI child declares @deco.Sortable', () => {
    class SortableStiBase extends ApplicationModel {
      public override get table() {
        return 'sortable_sti_models' as const
      }
    }

    it('throws during class decoration, naming the child, the field and the base', () => {
      const defineChild = () => {
        const deco = new Decorators<typeof InvalidSortableStiChild>()

        @STI(SortableStiBase)
        class InvalidSortableStiChild extends SortableStiBase {
          @deco.Sortable()
          public positionIndependent: DreamColumn<InvalidSortableStiChild, 'positionIndependent'>
        }

        return InvalidSortableStiChild
      }

      expect(defineChild).toThrow(StiChildCannotDeclareSortable)
      expect(defineChild).toThrow(
        /STI child class: InvalidSortableStiChild\nField: positionIndependent\nSTI base class: SortableStiBase[\s\S]*Declare @deco.Sortable for positionIndependent\non the STI base class, SortableStiBase; to keep a separate\nposition list for each STI type, declare it there with scope: 'type'/
      )
    })

    it('throws even when the child’s scope includes the type column', () => {
      const defineChild = () => {
        const deco = new Decorators<typeof TypeScopedSortableStiChild>()

        @STI(SortableStiBase)
        class TypeScopedSortableStiChild extends SortableStiBase {
          @deco.Sortable({ scope: 'type' })
          public positionByType: DreamColumn<TypeScopedSortableStiChild, 'positionByType'>
        }

        return TypeScopedSortableStiChild
      }

      expect(defineChild).toThrow(StiChildCannotDeclareSortable)
    })
  })

  context('when an STI base declares @deco.Sortable', () => {
    it('defines its children, which register the base’s sortable fields, with or without scope: type', () => {
      const deco = new Decorators<typeof SortableStiBase>()

      class SortableStiBase extends ApplicationModel {
        public override get table() {
          return 'sortable_sti_models' as const
        }

        @deco.Sortable()
        public positionIndependent: DreamColumn<SortableStiBase, 'positionIndependent'>

        @deco.Sortable({ scope: 'type' })
        public positionByType: DreamColumn<SortableStiBase, 'positionByType'>
      }

      const defineChild = () => {
        @STI(SortableStiBase)
        class SortableStiChild extends SortableStiBase {}

        return SortableStiChild
      }

      expect(defineChild).not.toThrow()

      const SortableStiChild = defineChild()
      processDynamicallyDefinedModels(SortableStiBase, SortableStiChild)

      expect(SortableStiChild['sortableFields']).toEqual([
        { scope: [], positionField: 'positionIndependent' },
        { scope: ['type'], positionField: 'positionByType' },
      ])
    })
  })

  context('when an STI child declares @deco.Virtual or @deco.Encrypted', () => {
    it('registers them on the child, as before', () => {
      class DynamicStiBase extends StiBase {}

      const deco = new Decorators<typeof StiChildWithVirtualAndEncrypted>()

      @STI(DynamicStiBase)
      class StiChildWithVirtualAndEncrypted extends DynamicStiBase {
        @deco.Virtual('string')
        public nickname: string

        @deco.Encrypted()
        public secret: DreamColumn<StiChildWithVirtualAndEncrypted, 'encryptedSecret'>
      }

      processDynamicallyDefinedModels(DynamicStiBase, StiChildWithVirtualAndEncrypted)

      expect(StiChildWithVirtualAndEncrypted['virtualAttributes'].map(attr => attr.property)).toEqual(
        expect.arrayContaining(['nickname', 'secret'])
      )
      expect(StiChildWithVirtualAndEncrypted['encryptedAttributes']).toEqual([
        { property: 'secret', encryptedColumnName: 'encryptedSecret', shapeDeclared: false },
      ])
      expect(DynamicStiBase['virtualAttributes'].map(attr => attr.property)).not.toContain('nickname')
    })
  })

  describe('sqlResultToDreamInstance', () => {
    it('hydrates an STI child through its registered discriminator metadata', () => {
      class DynamicStiBase extends StiBase {}
      let sanitizedName = 'RegisteredDiscriminator'

      @STI(DynamicStiBase)
      class MetadataBackedStiChild extends DynamicStiBase {
        public static override get sanitizedName() {
          return sanitizedName
        }
      }

      sanitizedName = 'RecomputedDiscriminator'
      const dream = sqlResultToDreamInstance(DynamicStiBase, {
        id: '123',
        type: 'RegisteredDiscriminator',
      })

      expect(dream).toBeInstanceOf(MetadataBackedStiChild)
      expect((dream as MetadataBackedStiChild).type).toEqual('RegisteredDiscriminator')
    })

    it('rejects a sibling discriminator before hydrating an STI child', () => {
      const hydrate = () =>
        sqlResultToDreamInstance(Mylar, {
          id: '123',
          type: 'Latex',
        })

      expect(hydrate).toThrow(STIChildTypeMismatch)
      expect(hydrate).toThrow(`
Cannot hydrate STI child from a row with a different discriminator.
Expected Dream class: Mylar
Expected type: Mylar
Type specified in DB record: Latex
STI base Dream class: Balloon
Table: beautiful_balloons
Primary key value: 123
    `)
    })

    it('rejects a missing discriminator before hydrating an STI child', () => {
      expect(() => sqlResultToDreamInstance(Mylar, { id: '123' })).toThrow(STIChildTypeMismatch)
    })

    it('hydrates an STI child when its discriminator matches', () => {
      const dream = sqlResultToDreamInstance(Mylar, {
        id: '123',
        type: 'Mylar',
      })

      expect(dream).toBeInstanceOf(Mylar)
      expect((dream as Mylar).type).toEqual('Mylar')
    })

    it('retains the missing registered child diagnostic for STI-base hydration', () => {
      expect(() =>
        sqlResultToDreamInstance(Balloon, {
          id: '123',
          type: 'MissingChild',
        })
      ).toThrow(STIChildMissing)
    })
  })

  describe('findExtendingDreamClass', () => {
    it('finds immediate extending classes', () => {
      expect(findExtendingDreamClass(Balloon, 'Mylar')).toEqual(Mylar)
      expect(findExtendingDreamClass(Balloon, 'Latex')).toEqual(Latex)
    })

    it('finds recursive extending classes', () => {
      expect(findExtendingDreamClass(Balloon, 'Animal')).toEqual(Animal)
    })
  })
})
