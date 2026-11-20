import DreamApp from '../../../src/dream-app/index.js'
import openapiShorthandToOpenapi from '../../../src/openapi/openapiShorthandToOpenapi.js'

describe('openapiShorthandToOpenapi', () => {
  context('string', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('string')).toEqual({ type: 'string' })
    })

    context('maybeNull', () => {
      it('includes null in the type', () => {
        expect(openapiShorthandToOpenapi('string', { maybeNull: true })).toEqual({ type: ['string', 'null'] })
      })
    })
  })

  context('boolean', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('boolean')).toEqual({ type: 'boolean' })
    })
  })

  context('number', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('number')).toEqual({ type: 'number' })
    })
  })

  context('date', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('date')).toEqual({ type: 'string', format: 'date' })
    })
  })

  context('date-time', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('date-time')).toEqual({ type: 'string', format: 'date-time' })
    })
  })

  context('integer', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('integer')).toEqual({ type: 'integer' })
    })
  })

  context('null', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('null')).toEqual({ type: 'null' })
    })
  })

  context('decimal', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('decimal')).toEqual({ type: 'number', format: 'decimal' })
    })
  })

  context('string[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('string[]')).toEqual({ type: 'array', items: { type: 'string' } })
    })

    context('maybeNull', () => {
      it('includes null in the type', () => {
        expect(openapiShorthandToOpenapi('string[]', { maybeNull: true })).toEqual({
          type: ['array', 'null'],
          items: { type: 'string' },
        })
      })
    })
  })

  context('boolean[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('boolean[]')).toEqual({ type: 'array', items: { type: 'boolean' } })
    })
  })

  context('number[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('number[]')).toEqual({ type: 'array', items: { type: 'number' } })
    })
  })

  context('date[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('date[]')).toEqual({
        type: 'array',
        items: { type: 'string', format: 'date' },
      })
    })
  })

  context('date-time[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('date-time[]')).toEqual({
        type: 'array',
        items: { type: 'string', format: 'date-time' },
      })
    })
  })

  context('decimal[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('decimal[]')).toEqual({
        type: 'array',
        items: { type: 'number', format: 'decimal' },
      })
    })
  })

  context('integer[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('integer[]')).toEqual({ type: 'array', items: { type: 'integer' } })
    })
  })

  context('json', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('json')).toEqual({ type: 'object' })
    })
  })

  context('a nullable shorthand', () => {
    it('includes null in the type, whichever side null is on', () => {
      expect(openapiShorthandToOpenapi(['integer', 'null'])).toEqual({ type: ['integer', 'null'] })
      expect(openapiShorthandToOpenapi(['null', 'date'])).toEqual({
        type: ['string', 'null'],
        format: 'date',
      })
      expect(openapiShorthandToOpenapi(['decimal[]', 'null'])).toEqual({
        type: ['array', 'null'],
        items: { type: 'number', format: 'decimal' },
      })
    })
  })

  context('format', () => {
    it('sets the format of a string and of each string in a string[]', () => {
      expect(openapiShorthandToOpenapi('string', { format: 'uuid' })).toEqual({
        type: 'string',
        format: 'uuid',
      })
      expect(openapiShorthandToOpenapi('string[]', { format: 'uuid' })).toEqual({
        type: 'array',
        items: { type: 'string', format: 'uuid' },
      })
    })
  })

  context('an object', () => {
    it('is returned as given, without being walked', () => {
      const shape = { type: 'object', properties: { name: 'string' } } as const
      expect(openapiShorthandToOpenapi(shape)).toBe(shape)
    })
  })

  context('anything else', () => {
    it('throws, naming the shape', () => {
      expect(() => openapiShorthandToOpenapi('howyadoin' as any)).toThrow(
        /Unrecognized OpenAPI shape:\n"howyadoin"/
      )
    })
  })

  it('is reachable through DreamApp.system', () => {
    expect(DreamApp.system.openapiShorthandToOpenapi).toBe(openapiShorthandToOpenapi)
  })
})
