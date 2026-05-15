import parseAttribute from '../../../src/helpers/cli/parseAttribute.js'

describe('parseAttribute', () => {
  context('scalar columns', () => {
    it('parses a name:type token', () => {
      expect(parseAttribute('email:string')).toEqual({
        rawAttributeName: 'email',
        aliasName: undefined,
        rawAttributeType: 'string',
        normalizedAttributeType: 'string',
        descriptors: [],
        isOptional: false,
        isArray: false,
      })
    })

    it('pops the trailing optional keyword', () => {
      expect(parseAttribute('hello:string:optional')).toEqual({
        rawAttributeName: 'hello',
        aliasName: undefined,
        rawAttributeType: 'string',
        normalizedAttributeType: 'string',
        descriptors: [],
        isOptional: true,
        isArray: false,
      })
    })

    it('reports arrays via isArray', () => {
      expect(parseAttribute('tags:string[]')).toMatchObject({
        rawAttributeType: 'string[]',
        normalizedAttributeType: 'string[]',
        isArray: true,
      })
    })
  })

  context('decimal with precision descriptors', () => {
    it('preserves precision descriptors', () => {
      expect(parseAttribute('deliciousness:decimal:4,2')).toMatchObject({
        rawAttributeName: 'deliciousness',
        normalizedAttributeType: 'decimal',
        descriptors: ['4,2'],
        isOptional: false,
      })
    })

    it('pops trailing optional after the precision descriptors', () => {
      expect(parseAttribute('deliciousness:decimal:4,2:optional')).toMatchObject({
        descriptors: ['4,2'],
        isOptional: true,
      })
    })
  })

  context('enum forms', () => {
    it('parses enum reuse (single descriptor = enum type name)', () => {
      expect(parseAttribute('style:enum:place_styles_enum')).toMatchObject({
        rawAttributeName: 'style',
        normalizedAttributeType: 'enum',
        descriptors: ['place_styles_enum'],
        isArray: false,
      })
    })

    it('parses enum with values (two descriptors)', () => {
      expect(parseAttribute('style:enum:place_styles:fancy,casual')).toMatchObject({
        descriptors: ['place_styles', 'fancy,casual'],
        isOptional: false,
      })
    })

    it('parses enum arrays', () => {
      expect(parseAttribute('style:enum[]:bed_types:twin,queen,king')).toMatchObject({
        normalizedAttributeType: 'enum[]',
        isArray: true,
      })
    })
  })

  context('belongs_to (legacy form, no alias)', () => {
    it('parses an unaliased belongs_to', () => {
      expect(parseAttribute('User:belongs_to')).toEqual({
        rawAttributeName: 'User',
        aliasName: undefined,
        rawAttributeType: 'belongs_to',
        normalizedAttributeType: 'belongsto',
        descriptors: [],
        isOptional: false,
        isArray: false,
      })
    })

    it('parses unaliased belongs_to with optional', () => {
      expect(parseAttribute('Music/Score:belongs_to:optional')).toMatchObject({
        rawAttributeName: 'Music/Score',
        aliasName: undefined,
        normalizedAttributeType: 'belongsto',
        isOptional: true,
      })
    })

    it('normalizes camelCase belongs_to spelling', () => {
      expect(parseAttribute('User:belongsTo')).toMatchObject({
        normalizedAttributeType: 'belongsto',
      })
    })
  })

  context('belongs_to with @alias (new form)', () => {
    it('extracts the alias from segment-1', () => {
      expect(parseAttribute('InternalUser@canceled_by:belongs_to')).toEqual({
        rawAttributeName: 'InternalUser',
        aliasName: 'canceled_by',
        rawAttributeType: 'belongs_to',
        normalizedAttributeType: 'belongsto',
        descriptors: [],
        isOptional: false,
        isArray: false,
      })
    })

    it('handles namespaced model with alias', () => {
      expect(parseAttribute('Messaging/Message@last_inbound_message:belongs_to:optional')).toEqual({
        rawAttributeName: 'Messaging/Message',
        aliasName: 'last_inbound_message',
        rawAttributeType: 'belongs_to',
        normalizedAttributeType: 'belongsto',
        descriptors: [],
        isOptional: true,
        isArray: false,
      })
    })

    it('returns null for empty alias after @', () => {
      expect(parseAttribute('Model@:belongs_to')).toBeNull()
    })

    it('returns null for empty model before @', () => {
      expect(parseAttribute('@alias:belongs_to')).toBeNull()
    })
  })

  context('has_one and has_many', () => {
    it('parses has_one with normalized type', () => {
      expect(parseAttribute('Pet:has_one')).toMatchObject({
        rawAttributeName: 'Pet',
        normalizedAttributeType: 'hasone',
      })
    })

    it('parses has_many with normalized type', () => {
      expect(parseAttribute('Pet:has_many')).toMatchObject({
        normalizedAttributeType: 'hasmany',
      })
    })
  })

  context('encrypted', () => {
    it('parses encrypted', () => {
      expect(parseAttribute('phone_number:encrypted')).toMatchObject({
        rawAttributeName: 'phone_number',
        normalizedAttributeType: 'encrypted',
      })
    })
  })

  context('malformed tokens', () => {
    it('returns null when name is missing', () => {
      expect(parseAttribute(':string')).toBeNull()
    })

    it('returns null when type is missing', () => {
      expect(parseAttribute('email')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(parseAttribute('')).toBeNull()
    })
  })
})
