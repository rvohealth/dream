import { Attribute, AttributeStatement, CalendarDate, DreamSerializer } from '../../../../src/index.js'
import { OpenapiSchemaBody } from '../../../../src/types/openapi.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'
import ModelForOpenapiTypeSpecs from '../../../../test-app/app/models/ModelForOpenapiTypeSpec.js'
import { BalloonTypesEnumValues, SpeciesTypesEnumValues } from '../../../../test-app/types/db.js'
import processDynamicallyDefinedSerializers from '../../../helpers/processDynamicallyDefinedSerializers.js'

describe('@Attribute', () => {
  context('with no arguments', () => {
    it('sets openApiShape to null', () => {
      class TestSerializer extends DreamSerializer {
        @Attribute()
        public name: string
      }
      processDynamicallyDefinedSerializers(TestSerializer)

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
        processDynamicallyDefinedSerializers(TestSerializer)

        const expectedOpenapiShape: OpenapiSchemaBody = { type: ['string', 'null'] }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'name',
            functional: false,
            openApiShape: expectedOpenapiShape,
            renderAs: 'string',
            renderOptions: undefined,
          },
        ])
      })
    })

    context('decorating a property corresponding to a date column', () => {
      it('attributeStatements specify field, OpenAPI type, and renderAs type', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenapiTypeSpecs)
          public birthdate: CalendarDate
        }
        processDynamicallyDefinedSerializers(TestSerializer)

        const expectedOpenapiShape: OpenapiSchemaBody = { type: ['string', 'null'], format: 'date' }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'birthdate',
            functional: false,
            openApiShape: expectedOpenapiShape,
            renderAs: 'date',
            renderOptions: undefined,
          },
        ])
      })
    })

    context('decorating a property corresponding to an integer column', () => {
      it('attributeStatements specify field, OpenAPI type, and renderAs type', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenapiTypeSpecs)
          public requiredCollarCountInt: number
        }
        processDynamicallyDefinedSerializers(TestSerializer)

        const expectedOpenapiShape: OpenapiSchemaBody = { type: 'integer' }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'requiredCollarCountInt',
            functional: false,
            openApiShape: expectedOpenapiShape,
            renderAs: 'integer',
            renderOptions: undefined,
          },
        ])
      })
    })

    context('decorating a property corresponding to a nullable integer column', () => {
      it('attributeStatements specify field, OpenAPI type, and renderAs type', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute(ModelForOpenapiTypeSpecs)
          public collarCountInt: number
        }
        processDynamicallyDefinedSerializers(TestSerializer)

        const expectedOpenapiShape: OpenapiSchemaBody = { type: ['integer', 'null'] }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'collarCountInt',
            functional: false,
            openApiShape: expectedOpenapiShape,
            renderAs: 'integer',
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
        processDynamicallyDefinedSerializers(TestSerializer)

        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: 'string',
          enum: BalloonTypesEnumValues,
        }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'type',
            functional: false,
            openApiShape: expectedOpenapiShape,
            renderAs: 'string',
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
          processDynamicallyDefinedSerializers(TestSerializer)

          const expectedOpenapiShape: OpenapiSchemaBody = {
            type: ['string', 'null'],
            enum: [...SpeciesTypesEnumValues],
          }

          expect(TestSerializer.attributeStatements).toEqual([
            {
              field: 'species',
              functional: false,
              openApiShape: expectedOpenapiShape,
              renderAs: 'string',
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
        processDynamicallyDefinedSerializers(TestSerializer)

        const expectedOpenapiShape: OpenapiSchemaBody = {
          type: ['string', 'null'],
          description: 'Hello world',
        }

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'name',
            functional: false,
            openApiShape: expectedOpenapiShape,
            renderAs: 'string',
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
        processDynamicallyDefinedSerializers(TestSerializer)

        const expectedOpenapiShape: OpenapiSchemaBody = { type: ['integer', 'null'] }

        const expected: AttributeStatement = {
          field: 'collarCountInt',
          functional: false,
          openApiShape: expectedOpenapiShape,
          renderAs: 'integer',
          renderOptions: undefined as any,
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
        processDynamicallyDefinedSerializers(TestSerializer)

        const expectedOpenapiShape: OpenapiSchemaBody = { type: ['number', 'null'], format: 'decimal' }

        const expected: AttributeStatement = {
          field: 'volume',
          functional: false,
          openApiShape: expectedOpenapiShape,
          renderAs: 'decimal',
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
      processDynamicallyDefinedSerializers(TestSerializer)

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
            @Attribute(['null', 'date-time[]'], { delegate: 'hello', description: 'Hello world' })
            public name: string
          }
          processDynamicallyDefinedSerializers(TestSerializer)

          expect(TestSerializer.attributeStatements).toEqual([
            {
              field: 'name',
              functional: false,
              openApiShape: { type: ['null', 'date-time[]'], description: 'Hello world' },
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
      processDynamicallyDefinedSerializers(TestSerializer)

      expect(TestSerializer.attributeStatements).toEqual([
        {
          field: 'name',
          functional: false,
          openApiShape: { type: 'date', description: 'Hello world' },
          renderAs: 'date',
          renderOptions: undefined,
        },
      ])
    })

    context('maybe null', () => {
      it('sets the openApiShape and renderAs', () => {
        class TestSerializer extends DreamSerializer {
          @Attribute({ type: ['string', 'null'], format: 'date-time', description: 'Hello world' })
          public happenedAt: string
        }
        processDynamicallyDefinedSerializers(TestSerializer)

        expect(TestSerializer.attributeStatements).toEqual([
          {
            field: 'happenedAt',
            functional: false,
            openApiShape: { type: ['string', 'null'], format: 'date-time', description: 'Hello world' },
            renderAs: 'date-time',
            renderOptions: undefined,
          },
        ])
      })
    })

    context(
      'with render options (which, in the shorthand case also include `nullable`, which is an OpenAPI option)',
      () => {
        it('sets the openApiShape and renderAs to that shorthand string', () => {
          class TestSerializer extends DreamSerializer {
            @Attribute({ type: ['decimal', 'null'] }, { precision: 2 })
            public name: string
          }
          processDynamicallyDefinedSerializers(TestSerializer)

          expect(TestSerializer.attributeStatements).toEqual([
            {
              field: 'name',
              functional: false,
              openApiShape: { type: ['decimal', 'null'] },
              renderAs: 'decimal',
              renderOptions: { precision: 2 },
            },
          ])
        })
      }
    )
  })
})
