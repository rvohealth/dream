import DreamApp from '../../../src/dream-app/index.js'
import createOpenapiAjv from '../../../src/openapi/createOpenapiAjv.js'
import expandOpenapiShorthand, {
  ExpandOpenapiShorthandOptions,
  OpenapiShorthandReferenceExpander,
  OpenapiShorthandSegment,
} from '../../../src/openapi/expandOpenapiShorthand.js'

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function validates(schema: object, value: unknown) {
  return createOpenapiAjv().compile(schema)(value)
}

describe('expandOpenapiShorthand', () => {
  const subject = (segment: OpenapiShorthandSegment, options: ExpandOpenapiShorthandOptions = {}) =>
    expandOpenapiShorthand(segment, options)

  it('is reachable through DreamApp.system', () => {
    expect(DreamApp.system.expandOpenapiShorthand).toBe(expandOpenapiShorthand)
  })

  it('expands primitive shorthands', () => {
    expect(subject('string')).toEqual({ type: 'string' })
    expect(subject('boolean')).toEqual({ type: 'boolean' })
    expect(subject('number')).toEqual({ type: 'number' })
    expect(subject('integer')).toEqual({ type: 'integer' })
    expect(subject('null')).toEqual({ type: 'null' })
    expect(subject('json')).toEqual({ type: 'object' })
  })

  it('expands computed shorthands', () => {
    expect(subject('date')).toEqual({ type: 'string', format: 'date' })
    expect(subject('date-time')).toEqual({ type: 'string', format: 'date-time' })
    expect(subject('decimal')).toEqual({ type: 'number', format: 'decimal' })
  })

  it('expands nullable shorthands', () => {
    expect(subject(['string', 'null'])).toEqual({ type: ['string', 'null'] })
    expect(subject(['null', 'date-time'])).toEqual({ type: ['string', 'null'], format: 'date-time' })
    expect(subject(['integer[]', 'null'])).toEqual({ type: ['array', 'null'], items: { type: 'integer' } })
  })

  it('expands undefined to an object', () => {
    expect(subject(undefined)).toEqual({ type: 'object' })
  })

  it('returns a description-only object as given', () => {
    const segment = { description: 'anything' }
    expect(subject(segment)).toBe(segment)
  })

  it('returns an object it does not know with its keys as given', () => {
    expect(subject({ $ref: '' } as any)).toEqual({ $ref: '' })
    expect(subject({ type: 'banana', description: 'hi' } as any)).toEqual({
      type: 'banana',
      description: 'hi',
    })
  })

  context('objects', () => {
    it('preserves description', () => {
      expect(subject({ type: 'string', description: 'hi' })).toEqual({
        type: 'string',
        description: 'hi',
      })
    })

    it('expands object primitives', () => {
      expect(subject({ type: 'string' })).toEqual({ type: 'string' })
      expect(subject({ type: 'boolean' })).toEqual({ type: 'boolean' })
      expect(subject({ type: 'number' })).toEqual({ type: 'number' })
      expect(subject({ type: 'integer' })).toEqual({ type: 'integer' })
      expect(subject({ type: 'decimal' })).toEqual({ type: 'number', format: 'decimal' })
      expect(subject({ type: 'date' })).toEqual({ type: 'string', format: 'date' })
      expect(subject({ type: 'date-time' })).toEqual({ type: 'string', format: 'date-time' })
    })

    it('keeps the other keys of an object primitive', () => {
      expect(subject({ type: 'string', enum: ['a', 'b'], description: 'letters' })).toEqual({
        type: 'string',
        enum: ['a', 'b'],
        description: 'letters',
      })
      expect(subject({ type: ['integer', 'null'], minimum: 1 })).toEqual({
        type: ['integer', 'null'],
        minimum: 1,
      })
    })

    it('expands objects with primitive arrays for types', () => {
      expect(subject({ type: 'string[]' })).toEqual({ type: 'array', items: { type: 'string' } })
      expect(subject({ type: 'boolean[]' })).toEqual({ type: 'array', items: { type: 'boolean' } })
      expect(subject({ type: 'number[]' })).toEqual({ type: 'array', items: { type: 'number' } })
      expect(subject({ type: 'integer[]' })).toEqual({ type: 'array', items: { type: 'integer' } })
      expect(subject({ type: 'decimal[]' })).toEqual({
        type: 'array',
        items: { type: 'number', format: 'decimal' },
      })
      expect(subject({ type: 'date[]' })).toEqual({
        type: 'array',
        items: { type: 'string', format: 'date' },
      })
      expect(subject({ type: 'date-time[]' })).toEqual({
        type: 'array',
        items: { type: 'string', format: 'date-time' },
      })
      expect(subject({ type: ['string[]', 'null'] } as any)).toEqual({
        type: ['array', 'null'],
        items: { type: 'string' },
      })
    })

    it('expands properties and additionalProperties at any depth', () => {
      expect(
        subject({
          type: ['object', 'null'],
          description: 'a thing',
          summary: 'thing',
          minProperties: 1,
          maxProperties: 3,
          required: ['name'],
          properties: {
            name: 'string',
            nested: { type: 'object', properties: { at: 'date-time' }, additionalProperties: false },
          },
          additionalProperties: 'integer[]',
        })
      ).toEqual({
        type: ['object', 'null'],
        description: 'a thing',
        summary: 'thing',
        minProperties: 1,
        maxProperties: 3,
        required: ['name'],
        properties: {
          name: { type: 'string' },
          nested: {
            type: 'object',
            properties: { at: { type: 'string', format: 'date-time' } },
            additionalProperties: false,
          },
        },
        additionalProperties: { type: 'array', items: { type: 'integer' } },
      })
    })

    it('drops every key an object schema does not render', () => {
      expect(
        subject({
          type: 'object',
          enum: ['x'],
          properties: { a: 'date' },
          required: ['a'],
          patternProperties: { x: 'string' },
        } as any)
      ).toEqual({ type: 'object', required: ['a'], properties: { a: { type: 'string', format: 'date' } } })
    })
  })

  context('arrays', () => {
    it('preserves description', () => {
      expect(subject({ type: 'string[]', description: 'hi' })).toEqual({
        type: 'array',
        description: 'hi',
        items: { type: 'string' },
      })

      expect(
        subject({ type: 'array', description: 'hi', items: { type: 'string', description: 'hi2' } })
      ).toEqual({
        type: 'array',
        description: 'hi',
        items: { type: 'string', description: 'hi2' },
      })
    })

    it('expands primitive array shorthands', () => {
      expect(subject('string[]')).toEqual({ type: 'array', items: { type: 'string' } })
      expect(subject('boolean[]')).toEqual({ type: 'array', items: { type: 'boolean' } })
      expect(subject('number[]')).toEqual({ type: 'array', items: { type: 'number' } })
      expect(subject('integer[]')).toEqual({ type: 'array', items: { type: 'integer' } })
      expect(subject('decimal[]')).toEqual({ type: 'array', items: { type: 'number', format: 'decimal' } })
      expect(subject('date[]')).toEqual({ type: 'array', items: { type: 'string', format: 'date' } })
      expect(subject('date-time[]')).toEqual({
        type: 'array',
        items: { type: 'string', format: 'date-time' },
      })
    })

    it('expands items at any depth', () => {
      expect(
        subject({
          type: ['array', 'null'],
          items: { type: 'array', items: { type: 'object', properties: { at: 'date' } } },
        })
      ).toEqual({
        type: ['array', 'null'],
        items: {
          type: 'array',
          items: { type: 'object', properties: { at: { type: 'string', format: 'date' } } },
        },
      })
    })
  })

  // `description` and `summary` are the fields Dream's OpenAPI types allow
  // beside `allOf`, `anyOf` and `oneOf`; every other key beside a combinator
  // is dropped, so a combinator never gains a `type` or a property lock
  context('keys beside a combinator', () => {
    const keysDropped = {
      type: ['object', 'null'],
      required: ['name'],
      additionalProperties: false,
      unevaluatedProperties: false,
    }

    it('keeps description and summary beside allOf, and drops every other key', () => {
      expect(
        subject({
          description: 'a named, aged thing',
          summary: 'named and aged',
          ...keysDropped,
          allOf: [
            { type: 'object', properties: { name: 'string' } },
            { type: 'object', properties: { age: 'integer' } },
          ],
        } as OpenapiShorthandSegment)
      ).toEqual({
        allOf: [
          { type: 'object', properties: { name: { type: 'string' } } },
          { type: 'object', properties: { age: { type: 'integer' } } },
        ],
        description: 'a named, aged thing',
        summary: 'named and aged',
      })
    })

    it('keeps description and summary beside anyOf, and drops every other key', () => {
      expect(
        subject({
          description: 'a name or a count',
          summary: 'name or count',
          ...keysDropped,
          anyOf: [{ type: 'string' }, { type: 'integer' }],
        } as OpenapiShorthandSegment)
      ).toEqual({
        anyOf: [{ type: 'string' }, { type: 'integer' }],
        description: 'a name or a count',
        summary: 'name or count',
      })
    })

    it('keeps description and summary beside oneOf, and drops every other key', () => {
      expect(
        subject({
          description: 'a name or a count',
          summary: 'name or count',
          ...keysDropped,
          oneOf: [{ type: 'string' }, { type: 'integer' }],
        } as OpenapiShorthandSegment)
      ).toEqual({
        oneOf: [{ type: 'string' }, { type: 'integer' }],
        description: 'a name or a count',
        summary: 'name or count',
      })
    })

    it('drops a type cast beside a combinator, so the combinator alone is enforced', () => {
      expect(subject({ type: 'integer', anyOf: ['string'] } as any)).toEqual({ anyOf: [{ type: 'string' }] })
    })

    it('makes a combinator nullable with a { type: null } branch, which renders and validates null', () => {
      const openapi = subject({
        description: 'the pet, when there is one',
        anyOf: [{ type: 'object', required: ['name'], properties: { name: 'string' } }, { type: 'null' }],
      })

      expect(openapi).toEqual({
        anyOf: [
          { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
          { type: 'null' },
        ],
        description: 'the pet, when there is one',
      })
      expect(validates(openapi, null)).toBe(true)
      expect(validates(openapi, { name: 'Fido' })).toBe(true)
      expect(validates(openapi, {})).toBe(false)
    })
  })

  context('suppressEnums', () => {
    it('replaces the enum of a string with a description listing its values', () => {
      expect(subject({ type: 'string', enum: ['a', 'b'] }, { suppressEnums: true })).toEqual({
        type: 'string',
        description: '\nThe following values will be allowed:\n  a,\n  b',
      })
    })

    it('keeps a description already given', () => {
      expect(
        subject({ type: 'string', enum: ['a', 'b'], description: 'letters' }, { suppressEnums: true })
      ).toEqual({
        type: 'string',
        description: 'letters',
      })
    })

    it('keeps the enum of a nullable string', () => {
      expect(subject({ type: ['string', 'null'], enum: ['a', 'b'] }, { suppressEnums: true })).toEqual({
        type: ['string', 'null'],
        enum: ['a', 'b'],
      })
    })

    it('keeps the enum when not set', () => {
      expect(subject({ type: 'string', enum: ['a', 'b'] })).toEqual({ type: 'string', enum: ['a', 'b'] })
    })
  })

  it('never modifies the shape it expands', () => {
    const shape = deepFreeze({
      type: 'object',
      properties: {
        name: 'string',
        kind: { type: 'string', enum: ['a', 'b'] },
        tags: { type: 'array', items: { type: 'object', properties: { at: 'date' } } },
        either: { anyOf: ['integer', { type: 'object', properties: { label: 'string' } }] },
      },
      additionalProperties: { type: 'object', properties: { count: 'integer' } },
    } as const)
    const before = structuredClone(shape)

    expect(() => subject(shape as OpenapiShorthandSegment, { suppressEnums: true })).not.toThrow()
    expect(shape).toEqual(before)
  })

  context('expandReference', () => {
    const REF = '#/components/schemas/Thing'

    it('is called first on every object node, at any depth, and replaces a node it returns a schema for', () => {
      const nodes: object[] = []
      const expandReference: OpenapiShorthandReferenceExpander = node => {
        nodes.push(node)
        return (node as { $thing?: true }).$thing ? { $ref: REF } : undefined
      }

      const thing = { $thing: true }
      const shape = {
        type: 'object',
        properties: {
          one: thing,
          many: { type: 'array', items: thing },
          either: { anyOf: [thing, { type: 'null' }] },
          deep: { type: 'object', properties: { inner: { allOf: [thing] } }, additionalProperties: thing },
        },
      } as unknown as OpenapiShorthandSegment

      expect(subject(shape, { expandReference })).toEqual({
        type: 'object',
        properties: {
          one: { $ref: REF },
          many: { type: 'array', items: { $ref: REF } },
          either: { anyOf: [{ $ref: REF }, { type: 'null' }] },
          deep: {
            type: 'object',
            properties: { inner: { allOf: [{ $ref: REF }] } },
            additionalProperties: { $ref: REF },
          },
        },
      })
      expect(nodes[0]).toBe(shape)
      expect(nodes.filter(node => node === thing)).toHaveLength(5)
    })

    it('is not called on a primitive shorthand string', () => {
      const expandReference = vi.fn<OpenapiShorthandReferenceExpander>(() => undefined)
      subject('string', { expandReference })
      expect(expandReference).not.toHaveBeenCalled()
    })

    it('hands the hook an expand that expands a child with the same options, the hook included', () => {
      const expandReference: OpenapiShorthandReferenceExpander = (node, expand) => {
        const forShape = (node as { for?: OpenapiShorthandSegment }).for
        if (forShape) return expand(forShape)
        return (node as { $thing?: true }).$thing ? { $ref: REF } : undefined
      }

      expect(
        subject(
          {
            for: {
              type: 'object',
              properties: { kind: { type: 'string', enum: ['a'] }, thing: { $thing: true } },
            },
          } as unknown as OpenapiShorthandSegment,
          { expandReference, suppressEnums: true }
        )
      ).toEqual({
        type: 'object',
        properties: {
          kind: { type: 'string', description: '\nThe following values will be allowed:\n  a' },
          thing: { $ref: REF },
        },
      })
    })
  })
})
