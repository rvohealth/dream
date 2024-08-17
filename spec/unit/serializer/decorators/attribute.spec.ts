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

  context('with a Dream model and column name', () => {
    context('with a string attribute', () => {
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

    context('with an enum attribute', () => {
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

    context('with an integer attribute', () => {
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

    context('with a decimal attribute', () => {
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
})
