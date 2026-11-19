import Decorators from '../../../../src/decorators/Decorators.js'
import JSONDecoratorRequiresJsonColumn from '../../../../src/errors/JSONDecoratorRequiresJsonColumn.js'
import JSONDecoratorShapeAllowsNull from '../../../../src/errors/JSONDecoratorShapeAllowsNull.js'
import ModelDeclaredShapeContainsReference from '../../../../src/errors/ModelDeclaredShapeContainsReference.js'
import { DreamColumn } from '../../../../src/types/dream.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'
import Composition from '../../../../test-app/app/models/Composition.js'
import User from '../../../../test-app/app/models/User.js'
import UserSerializer from '../../../../test-app/app/serializers/UserSerializer.js'
import processDynamicallyDefinedModels from '../../../helpers/processDynamicallyDefinedModels.js'

describe('@deco.JSON', () => {
  it('registers the declared shape under the class’s jsonColumnShapes', () => {
    expect(Composition['jsonColumnShapes']).toEqual([
      {
        column: 'metadata',
        openapi: {
          type: 'object',
          properties: { version: 'integer', contributors: 'string[]' },
        },
      },
    ])
  })

  it('leaves the decorated column a real column, not a virtual attribute', () => {
    expect(Composition.isVirtualColumn('metadata')).toBe(false)
    expect(Composition['virtualAttributes'].map(attr => attr.property)).not.toContain('metadata')
    expect(Composition.isColumn('metadata')).toBe(true)
  })

  it('leaves the decorated column saved and loaded as a column', async () => {
    const user = await User.create({ email: 'fred@frewd', password: 'howyadoin', name: 'fred' })
    const composition = await Composition.create({ user, metadata: { version: 2, contributors: ['Ann'] } })

    const reloaded = await Composition.findOrFail(composition.id)
    expect(reloaded.metadata).toEqual({ version: 2, contributors: ['Ann'] })
  })

  it('accepts a primitive shorthand shape', () => {
    const deco = new Decorators<typeof PrimitiveJsonModel>()

    class PrimitiveJsonModel extends ApplicationModel {
      public override get table() {
        return 'model_for_openapi_type_specs' as const
      }

      @deco.JSON('string[]')
      public jsonbData: DreamColumn<PrimitiveJsonModel, 'jsonbData'>
    }

    processDynamicallyDefinedModels(PrimitiveJsonModel)

    expect(PrimitiveJsonModel['jsonColumnShapes']).toEqual([{ column: 'jsonbData', openapi: 'string[]' }])
  })

  context('on a property that is not a json/jsonb column', () => {
    it('throws when the models load, naming the model and property', () => {
      const deco = new Decorators<typeof NonJsonColumnModel>()

      class NonJsonColumnModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        // @ts-expect-error @deco.JSON may only decorate a json/jsonb column
        @deco.JSON({ type: 'object', properties: { hello: 'string' } })
        public name: DreamColumn<NonJsonColumnModel, 'name'>
      }

      expect(() => processDynamicallyDefinedModels(NonJsonColumnModel)).toThrow(
        JSONDecoratorRequiresJsonColumn
      )
      expect(() => processDynamicallyDefinedModels(NonJsonColumnModel)).toThrow(
        /NonJsonColumnModel[\s\S]*Property: name, which is a "character varying" column/
      )
    })

    it('throws when the models load on a property that is not a column at all', () => {
      const deco = new Decorators<typeof NotAColumnModel>()

      class NotAColumnModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        // @ts-expect-error @deco.JSON may only decorate a json/jsonb column
        @deco.JSON({ type: 'object', properties: { hello: 'string' } })
        public notAColumn: Record<string, string>
      }

      expect(() => processDynamicallyDefinedModels(NotAColumnModel)).toThrow(
        /Property: notAColumn, which is not a column of the "model_for_openapi_type_specs" table/
      )
    })
  })

  context('with a shape that allows null', () => {
    it('throws when the models load on a column that is not an array', () => {
      const deco = new Decorators<typeof NullableShapeModel>()

      class NullableShapeModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON({ type: ['object', 'null'], properties: { hello: 'string' } })
        public jsonbData: DreamColumn<NullableShapeModel, 'jsonbData'>
      }

      expect(() => processDynamicallyDefinedModels(NullableShapeModel)).toThrow(JSONDecoratorShapeAllowsNull)
      expect(() => processDynamicallyDefinedModels(NullableShapeModel)).toThrow(
        /NullableShapeModel#jsonbData allows null/
      )
    })

    it('throws when the models load on a nullable primitive shorthand', () => {
      const deco = new Decorators<typeof NullablePrimitiveModel>()

      class NullablePrimitiveModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON(['string', 'null'])
        public jsonbData: DreamColumn<NullablePrimitiveModel, 'jsonbData'>
      }

      expect(() => processDynamicallyDefinedModels(NullablePrimitiveModel)).toThrow(
        JSONDecoratorShapeAllowsNull
      )
    })

    it('throws when the models load on an anyOf with a null branch', () => {
      const deco = new Decorators<typeof NullableAnyOfModel>()

      class NullableAnyOfModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON({ anyOf: [{ type: 'object', properties: { hello: 'string' } }, { type: 'null' }] })
        public jsonbData: DreamColumn<NullableAnyOfModel, 'jsonbData'>
      }

      expect(() => processDynamicallyDefinedModels(NullableAnyOfModel)).toThrow(JSONDecoratorShapeAllowsNull)
    })

    it('allows a nullable element shape on a json[]/jsonb[] column', () => {
      const deco = new Decorators<typeof NullableElementModel>()

      class NullableElementModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON({ type: ['object', 'null'], properties: { hello: 'string' } })
        public favoriteJsonbs: DreamColumn<NullableElementModel, 'favoriteJsonbs'>
      }

      processDynamicallyDefinedModels(NullableElementModel)

      expect(NullableElementModel['jsonColumnShapes']).toEqual([
        {
          column: 'favoriteJsonbs',
          openapi: { type: ['object', 'null'], properties: { hello: 'string' } },
        },
      ])
    })

    it('allows null nested inside the shape', () => {
      const deco = new Decorators<typeof NestedNullModel>()

      class NestedNullModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON({ type: 'object', properties: { hello: ['string', 'null'] } })
        public jsonData: DreamColumn<NestedNullModel, 'jsonData'>
      }

      expect(() => processDynamicallyDefinedModels(NestedNullModel)).not.toThrow()
    })
  })

  context('with a shape that contains a reference', () => {
    it('is a compile error, and throws when the models load, for a reference at the top level', () => {
      const deco = new Decorators<typeof TopLevelRefModel>()

      class TopLevelRefModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        // @ts-expect-error a @deco.JSON shape may not contain a reference
        @deco.JSON({ $serializer: UserSerializer })
        public jsonbData: DreamColumn<TopLevelRefModel, 'jsonbData'>
      }

      expect(() => processDynamicallyDefinedModels(TopLevelRefModel)).toThrow(
        ModelDeclaredShapeContainsReference
      )
      expect(() => processDynamicallyDefinedModels(TopLevelRefModel)).toThrow(
        /@deco\.JSON on TopLevelRefModel#jsonbData[\s\S]*`\$serializer` at the top level of the shape[\s\S]*Remove @deco\.JSON from TopLevelRefModel#jsonbData[\s\S]*\{ openapi \}[\s\S]*`combining`/
      )
    })

    it('is a compile error, and throws when the models load, for a reference nested in the shape', () => {
      const deco = new Decorators<typeof NestedRefModel>()

      class NestedRefModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON({
          type: 'object',
          properties: {
            // @ts-expect-error a @deco.JSON shape may not contain a reference
            owner: { type: 'array', items: { anyOf: [{ type: 'string' }, { $schema: 'Owner' }] } },
          },
        })
        public jsonbData: DreamColumn<NestedRefModel, 'jsonbData'>
      }

      expect(() => processDynamicallyDefinedModels(NestedRefModel)).toThrow(
        /@deco\.JSON on NestedRefModel#jsonbData[\s\S]*`\$schema` at `properties\.owner\.items\.anyOf\[1\]`/
      )
    })

    it('is a compile error, and throws when the models load, for each kind of reference', () => {
      const deco = new Decorators<typeof EachRefModel>()

      class EachRefModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        // @ts-expect-error a @deco.JSON shape may not contain a reference
        @deco.JSON({ type: 'object', additionalProperties: { $serializable: User } })
        public jsonbData: DreamColumn<EachRefModel, 'jsonbData'>

        // @ts-expect-error a @deco.JSON shape may not contain a reference
        @deco.JSON({ oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Owner' }] })
        public jsonData: DreamColumn<EachRefModel, 'jsonData'>
      }

      expect(() => processDynamicallyDefinedModels(EachRefModel)).toThrow(
        /`\$serializable` at `additionalProperties`/
      )
    })

    it('throws when the models load for a reference smuggled past the types with a cast', () => {
      const deco = new Decorators<typeof CastRefModel>()

      class CastRefModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON({ type: 'object', properties: { owner: { $ref: '#/components/schemas/Owner' } } } as any)
        public jsonbData: DreamColumn<CastRefModel, 'jsonbData'>
      }

      expect(() => processDynamicallyDefinedModels(CastRefModel)).toThrow(
        /@deco\.JSON on CastRefModel#jsonbData[\s\S]*`\$ref` at `properties\.owner`/
      )
    })

    it('throws when the models load for a reference in an `as const` constant, which the types do not catch', () => {
      const shapeWithRef = {
        type: 'object',
        properties: { owner: { type: 'string', $schema: 'Owner' } },
      } as const

      const deco = new Decorators<typeof ConstRefModel>()

      class ConstRefModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON(shapeWithRef)
        public jsonbData: DreamColumn<ConstRefModel, 'jsonbData'>
      }

      expect(() => processDynamicallyDefinedModels(ConstRefModel)).toThrow(
        /`\$schema` at `properties\.owner`/
      )
    })

    it('accepts a property named like a reference keyword, which is not a reference', () => {
      const deco = new Decorators<typeof RefNamedPropertyModel>()

      class RefNamedPropertyModel extends ApplicationModel {
        public override get table() {
          return 'model_for_openapi_type_specs' as const
        }

        @deco.JSON({ type: 'object', properties: { $ref: 'string' } })
        public jsonbData: DreamColumn<RefNamedPropertyModel, 'jsonbData'>
      }

      expect(() => processDynamicallyDefinedModels(RefNamedPropertyModel)).not.toThrow()
    })
  })
})
