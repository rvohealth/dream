import { Attribute, AttributeStatement, DreamSerializer, OpenapiSchemaBody } from '../../../../src'
import Balloon from '../../../../test-app/app/models/Balloon'
import Pet from '../../../../test-app/app/models/Pet'
import Post from '../../../../test-app/app/models/Post'

describe('@Attribute', () => {
  context('with no arguments', () => {
    it('', () => {})
  })

  context('with a Dream model and column name', () => {
    context('with a string attribute', () => {
      it('attributeStatements specify field, OpenAPI type, and renderAs type', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(Pet)
          public name: string
        }

        const expectedOpenApiShape: OpenapiSchemaBody = { type: 'string', nullable: true }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'name',
            functional: false,
            openApiShape: expectedOpenApiShape,
            renderAs: 'string',
            renderOptions: {},
          },
        ])
      })
    })

    context('with an OpenAPI description', () => {
      it('includes the description in the OpenAPI shape', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(Pet, { description: 'Hello world' })
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
            renderAs: 'string',
            renderOptions: {},
          },
        ])
      })
    })

    context('with an integer attribute', () => {
      it('integers allow specification of precision', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(Post)
          public position: number
        }

        const expectedOpenApiShape: OpenapiSchemaBody = { type: 'integer', nullable: true }

        const expected: AttributeStatement = {
          field: 'position',
          functional: false,
          openApiShape: expectedOpenApiShape,
          renderAs: 'number',
          renderOptions: {},
        }

        expect(TestSerializer.attributeStatements).toEqual([expected])
      })
    })

    context('with a decimal attribute', () => {
      it('decimals allow specification of precision', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(Balloon, null, { precision: 2 })
          public volume: number
        }

        const expectedOpenApiShape: OpenapiSchemaBody = { type: 'number', format: 'decimal', nullable: true }

        const expected: AttributeStatement = {
          field: 'volume',
          functional: false,
          openApiShape: expectedOpenApiShape,
          renderAs: 'number',
          renderOptions: { precision: 2 },
        }

        expect(TestSerializer.attributeStatements).toEqual([expected])
      })
    })
  })
})
