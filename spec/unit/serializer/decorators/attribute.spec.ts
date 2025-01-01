import { Attribute, AttributeStatement, DreamSerializer } from '../../../../src'
import { OpenapiSchemaBody } from '../../../../src/openapi/types'
import Balloon from '../../../../test-app/app/models/Balloon'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec'
import { BalloonTypesEnumValues, SpeciesTypesEnumValues } from '../../../../test-app/types/sync'

describe('@Attribute', () => {
  context('with no arguments', () => {
    it('sets openApiShape to null', () => {
      class TestSerializer extends DreamSerializer {
        @Attribute()
        public name: string
      }

      expect(TestSerializer.attributeStatements).toEqual([
        {
          field: 'name',
          functional: false,
          openApiShape: undefined,
          renderAs: undefined,
          renderOptions: undefined,
        },
      ])
    })
  })

  context('with a Dream model', () => {
    context('decorating a property corresponding to a string column', () => {
      it('attributeStatements specify field, OpenAPI type, and renderAs type', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenapiTypeSpecs)
          public name: string
        }

        const expectedOpenapiShape: OpenapiSchemaBody = { type: 'string', nullable: true }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'name',
            functional: false,
            openApiShape: expectedOpenapiShape,
            renderAs: undefined,
            renderOptions: undefined,
          },
        ])
      })
    })

    context('decorating a property corresponding to an enum column', () => {
      it('attributeStatements specify the enum type', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(Balloon)
          public type: string
        }

        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          enum: BalloonTypesEnumValues,
        }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'type',
            functional: false,
            openApiShape: expectedOpenapiShape,
            renderAs: undefined,
            renderOptions: undefined,
          },
        ])
      })

      context('when the column is nullable', () => {
        it('includes nullable true and null in the enum values', () => {
          class TestSerializer extends DreamSerializer {
            @Attribute(ModelForOpenapiTypeSpecs)
            public species: string
          }

          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: 'string',
            enum: [...SpeciesTypesEnumValues, 'null'],
            nullable: true,
          }

          expect(TestSerializer.attributeStatements).toEqual([
            {
              field: 'species',
              functional: false,
              openApiShape: expectedOpenapiShape,
              renderAs: undefined,
              renderOptions: undefined,
            },
          ])
        })
      })
    })

    context('with an OpenAPI description', () => {
      it('includes the description in the OpenAPI shape', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenapiTypeSpecs, { description: 'Hello world' })
          public name: string
        }

        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          description: 'Hello world',
          nullable: true,
        }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'name',
            functional: false,
            openApiShape: expectedOpenapiShape,
            renderAs: undefined,
            renderOptions: undefined,
          },
        ])
      })
    })

    context('decorating a property corresponding to an integer column', () => {
      it('integers allow specification of precision', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenapiTypeSpecs)
          public collarCountInt: number
        }

        const expectedOpenapiShape: OpenapiSchemaBody = { type: 'integer', nullable: true }

        const expected: AttributeStatement = {
          field: 'collarCountInt',
          functional: false,
          openApiShape: expectedOpenapiShape,
          renderAs: undefined,
          renderOptions: undefined,
        }

        expect(TestSerializer.attributeStatements).toEqual([expected])
      })
    })

    context('decorating a property corresponding to a decimal column', () => {
      it('decimals allow specification of precision', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenapiTypeSpecs, { precision: 2 })
          public volume: number
        }

        const expectedOpenapiShape: OpenapiSchemaBody = { type: 'number', format: 'decimal', nullable: true }

        const expected: AttributeStatement = {
          field: 'volume',
          functional: false,
          openApiShape: expectedOpenapiShape,
          renderAs: undefined,
          renderOptions: { precision: 2 },
        }

        expect(TestSerializer.attributeStatements).toEqual([expected])
      })
    })
  })

  context('with a type shorthand string', () => {
    it('sets the openApiShape and renderAs to that shorthand string', () => {
      class TestSerializer extends DreamSerializer {
        @Attribute('date-time[]')
        public name: string
      }

      expect(TestSerializer.attributeStatements).toEqual([
        {
          field: 'name',
          functional: false,
          openApiShape: { type: 'date-time[]' },
          renderAs: 'date-time[]',
          renderOptions: undefined,
        },
      ])
    })

    context(
      'with render options (which, in the shorthand case also include `nullable`, which is an OpenAPI option)',
      () => {
        it('sets the openApiShape and renderAs to that shorthand string', () => {
          class TestSerializer extends DreamSerializer {
            @Attribute('date-time[]', { nullable: true, delegate: 'hello', description: 'Hello world' })
            public name: string
          }

          expect(TestSerializer.attributeStatements).toEqual([
            {
              field: 'name',
              functional: false,
              openApiShape: { type: 'date-time[]', nullable: true, description: 'Hello world' },
              renderAs: 'date-time[]',
              renderOptions: { delegate: 'hello' },
            },
          ])
        })
      }
    )
  })

  context('with an OpenAPI specification', () => {
    it('sets the openApiShape and renderAs to that shorthand string', () => {
      class TestSerializer extends DreamSerializer {
        @Attribute({ type: 'date', description: 'Hello world' })
        public name: string
      }

      expect(TestSerializer.attributeStatements).toEqual([
        {
          field: 'name',
          functional: false,
          openApiShape: { type: 'date', description: 'Hello world' },
          renderAs: { type: 'date', description: 'Hello world' },
          renderOptions: undefined,
        },
      ])
    })

    context(
      'with render options (which, in the shorthand case also include `nullable`, which is an OpenAPI option)',
      () => {
        it('sets the openApiShape and renderAs to that shorthand string', () => {
          class TestSerializer extends DreamSerializer {
            @Attribute({ type: 'decimal', nullable: true }, { precision: 2 })
            public name: string
          }

          expect(TestSerializer.attributeStatements).toEqual([
            {
              field: 'name',
              functional: false,
              openApiShape: { type: 'decimal', nullable: true },
              renderAs: { type: 'decimal', nullable: true },
              renderOptions: { precision: 2 },
            },
          ])
        })
      }
    )
  })
})
