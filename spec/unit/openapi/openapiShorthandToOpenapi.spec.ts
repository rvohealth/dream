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
      expect(openapiShorthandToOpenapi('date')).toEqual({ type: 'date' })
    })
  })

  context('date-time', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('date-time')).toEqual({ type: 'date-time' })
    })
  })

  context('double', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('double')).toEqual({ type: 'double' })
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
      expect(openapiShorthandToOpenapi('decimal')).toEqual({ type: 'decimal' })
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
      expect(openapiShorthandToOpenapi('date[]')).toEqual({ type: 'array', items: { type: 'date' } })
    })
  })

  context('date-time[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('date-time[]')).toEqual({
        type: 'array',
        items: { type: 'date-time' },
      })
    })
  })

  context('decimal[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('decimal[]')).toEqual({ type: 'array', items: { type: 'decimal' } })
    })
  })

  context('double[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('double[]')).toEqual({ type: 'array', items: { type: 'double' } })
    })
  })

  context('integer[]', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('integer[]')).toEqual({ type: 'array', items: { type: 'integer' } })
    })
  })

  context('json', () => {
    it('becomes OpenAPI', () => {
      expect(openapiShorthandToOpenapi('json')).toEqual({ type: 'json' })
    })
  })
})
