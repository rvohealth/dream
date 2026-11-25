import { Ajv2020 } from 'ajv/dist/2020.js'
import DreamApp from '../../../src/dream-app/index.js'
import createOpenapiAjv from '../../../src/openapi/createOpenapiAjv.js'

describe('createOpenapiAjv', () => {
  const compile = (schema: object, options: Parameters<typeof createOpenapiAjv>[0] = {}) =>
    createOpenapiAjv(options).compile(schema)

  it('is reachable through DreamApp.system', () => {
    expect(DreamApp.system.createOpenapiAjv).toBe(createOpenapiAjv)
  })

  it('returns a JSON Schema 2020-12 AJV instance', () => {
    expect(createOpenapiAjv()).toBeInstanceOf(Ajv2020)

    const validate = compile({ type: 'array', prefixItems: [{ type: 'integer' }], items: { type: 'string' } })
    expect(validate([1, 'a'])).toBe(true)
    expect(validate([1, 2])).toBe(false)
  })

  context('defaults', () => {
    it('does not coerce types', () => {
      const validate = compile({ type: 'integer' })
      const value = '5'
      expect(validate(value)).toBe(false)
      expect(value).toEqual('5')
    })

    it('applies defaults', () => {
      const data: { name?: string } = {}
      expect(compile({ type: 'object', properties: { name: { type: 'string', default: 'x' } } })(data)).toBe(
        true
      )
      expect(data).toEqual({ name: 'x' })
    })

    it('does not remove additional properties', () => {
      const data = { name: 'x', extra: true }
      expect(compile({ type: 'object', properties: { name: { type: 'string' } } })(data)).toBe(true)
      expect(data).toEqual({ name: 'x', extra: true })
    })

    it('reports the first error only', () => {
      const validate = compile({
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'string' } },
      })
      expect(validate({ a: 1, b: 2 })).toBe(false)
      expect(validate.errors).toHaveLength(1)
    })

    it('ignores keywords JSON Schema does not know, such as OpenAPI’s example', () => {
      expect(() => compile({ type: 'string', example: 'hi', nullable: true })).not.toThrow()
    })

    it('ignores a format it does not know', () => {
      expect(compile({ type: 'string', format: 'howyadoin' })('anything')).toBe(true)
    })
  })

  it('applies the options given over its defaults', () => {
    const data: { name?: string } = {}
    const validate = compile(
      { type: 'object', properties: { name: { type: 'string', default: 'x' }, a: { type: 'integer' } } },
      { useDefaults: false, coerceTypes: true, allErrors: true }
    )
    const coerced = { a: '5' }

    expect(validate(data)).toBe(true)
    expect(data).toEqual({})
    expect(validate(coerced)).toBe(true)
    expect(coerced).toEqual({ a: 5 })
  })

  context('formats', () => {
    it('checks the decimal format on a string', () => {
      const validate = compile({ type: 'string', format: 'decimal' })
      for (const value of ['1', '-1', '1.5', '1.', '.5', '-.5', '-12.340']) expect(validate(value)).toBe(true)
      for (const value of ['', '1.2.3', 'abc', '1e5', '+1', ' 1']) expect(validate(value)).toBe(false)
    })

    it('leaves a number with the decimal format to its type', () => {
      expect(compile({ type: 'number', format: 'decimal' })(1.5)).toBe(true)
    })

    it('checks the bigint format on a string', () => {
      const validate = compile({ type: 'string', format: 'bigint' })
      for (const value of ['123', '-12', '12.000', '9007199254740993']) expect(validate(value)).toBe(true)
      for (const value of ['1.5', 'abc', '', '1e5']) expect(validate(value)).toBe(false)
    })

    // these formats check strings a client submits, so a long string that
    // does not match must not make the check backtrack: a quadratic check
    // takes about 40 seconds here, and a linear one under a millisecond
    it.each(['decimal', 'bigint'])('refuses a long string that is not a %s in linear time', format => {
      const validate = compile({ type: 'string', format })
      const longRuns = ['1'.repeat(400_000) + 'x', '1.' + '0'.repeat(400_000) + 'x']

      const startedAt = performance.now()
      for (const value of longRuns) expect(validate(value)).toBe(false)
      expect(performance.now() - startedAt).toBeLessThan(2000)
    })

    it('checks the ajv-formats formats', () => {
      const cases: [string, string, string][] = [
        ['date', '2023-01-01', '2023-13-01'],
        ['date-time', '2023-01-01T10:00:00Z', '2023-01-01'],
        ['email', 'john@example.com', 'invalid-email'],
        ['uuid', '123e4567-e89b-12d3-a456-426614174000', 'not-a-uuid'],
        ['uri', 'https://example.com', 'not a uri'],
      ]

      for (const [format, valid, invalid] of cases) {
        const validate = compile({ type: 'string', format })
        expect(validate(valid)).toBe(true)
        expect(validate(invalid)).toBe(false)
      }
    })

    it('lets a caller add its own format to the instance', () => {
      const ajv = createOpenapiAjv()
      ajv.addFormat('howyadoin', { type: 'string', validate: data => data === 'howyadoin' })
      const validate = ajv.compile({ type: 'string', format: 'howyadoin' })

      expect(validate('howyadoin')).toBe(true)
      expect(validate('not-howyadoin')).toBe(false)
    })
  })
})
