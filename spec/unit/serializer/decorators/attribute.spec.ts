import { Attribute, AttributeStatement, DreamSerializer, OpenapiSchemaBody } from '../../../../src'
import ModelForOpenApiTypeSpecs from '../../../../test-app/app/models/ModelForOpenApiTypeSpec'
import { SpeciesTypesEnumValues } from '../../../../test-app/db/sync'

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
          @Attribute(ModelForOpenApiTypeSpecs)
          public name: string
        }

        const expectedOpenApiShape: OpenapiSchemaBody = { type: 'string', nullable: true }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'name',
            functional: false,
            openApiShape: expectedOpenApiShape,
            renderAs: undefined,
            renderOptions: undefined,
          },
        ])
      })
    })

    context('decorating a property corresponding to an enum column', () => {
      it('attributeStatements specify the enum type', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenApiTypeSpecs)
          public species: string
        }

        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'string',
          enum: SpeciesTypesEnumValues,
          nullable: true,
        }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'species',
            functional: false,
            openApiShape: expectedOpenApiShape,
            renderAs: undefined,
            renderOptions: undefined,
          },
        ])
      })
    })

    context('with an OpenAPI description', () => {
      it('includes the description in the OpenAPI shape', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenApiTypeSpecs, { description: 'Hello world' })
          public name: string
        }

        const expectedOpenApiShape: OpenapiSchemaBody = {
          type: 'string',
          description: 'Hello world',
          nullable: true,
        }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'name',
            functional: false,
            openApiShape: expectedOpenApiShape,
            renderAs: undefined,
            renderOptions: undefined,
          },
        ])
      })
    })

    context('decorating a property corresponding to an integer column', () => {
      it('integers allow specification of precision', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenApiTypeSpecs)
          public collarCountInt: number
        }

        const expectedOpenApiShape: OpenapiSchemaBody = { type: 'integer', nullable: true }

        const expected: AttributeStatement = {
          field: 'collarCountInt',
          functional: false,
          openApiShape: expectedOpenApiShape,
          renderAs: undefined,
          renderOptions: undefined,
        }

        expect(TestSerializer.attributeStatements).toEqual([expected])
      })
    })

    context('decorating a property corresponding to a decimal column', () => {
      it('decimals allow specification of precision', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenApiTypeSpecs, null, { precision: 2 })
          public volume: number
        }

        const expectedOpenApiShape: OpenapiSchemaBody = { type: 'number', format: 'decimal', nullable: true }

        const expected: AttributeStatement = {
          field: 'volume',
          functional: false,
          openApiShape: expectedOpenApiShape,
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
      'with render options (which, in the shorthand case also include `allowNull`, which is an OpenAPI option)',
      () => {
        it('sets the openApiShape and renderAs to that shorthand string', () => {
          class TestSerializer extends DreamSerializer {
            @Attribute('date-time[]', { allowNull: true, delegate: 'hello' })
            public name: string
          }

          expect(TestSerializer.attributeStatements).toEqual([
            {
              field: 'name',
              functional: false,
              openApiShape: { type: 'date-time[]' },
              renderAs: 'date-time[]',
              renderOptions: { allowNull: true, delegate: 'hello' },
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
      'with render options (which, in the shorthand case also include `allowNull`, which is an OpenAPI option)',
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
