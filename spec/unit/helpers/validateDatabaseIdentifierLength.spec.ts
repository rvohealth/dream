import IdentifierExceedsMaxLengthForDatabase from '../../../src/errors/IdentifierExceedsMaxLengthForDatabase.js'
import validateDatabaseIdentifierLength from '../../../src/helpers/validateDatabaseIdentifierLength.js'

describe('validateDatabaseIdentifierLength', () => {
  context('with a snake_case identifier within the 63-byte limit', () => {
    it('does not throw', () => {
      expect(() => {
        validateDatabaseIdentifierLength('short_name', { isSnakeCase: true, identifierType: 'column name' })
      }).not.toThrow()
    })
  })

  context('with a snake_case identifier at exactly 63 bytes', () => {
    it('does not throw', () => {
      // 63 characters of ASCII = 63 bytes
      const identifier = 'a'.repeat(63)
      expect(() => {
        validateDatabaseIdentifierLength(identifier, { isSnakeCase: true, identifierType: 'column name' })
      }).not.toThrow()
    })
  })

  context('with a snake_case identifier exceeding 63 bytes', () => {
    it('throws IdentifierExceedsMaxLengthForDatabase', () => {
      const identifier = 'a'.repeat(64)
      expect(() => {
        validateDatabaseIdentifierLength(identifier, { isSnakeCase: true, identifierType: 'column name' })
      }).toThrow(IdentifierExceedsMaxLengthForDatabase)
    })
  })

  context('with a camelCase identifier that becomes too long in snake_case', () => {
    it('throws IdentifierExceedsMaxLengthForDatabase', () => {
      // "aVeryLongCamelCaseIdentifierThatWillExceedTheSixtyThreeByteLimit" in camelCase
      // becomes "a_very_long_camel_case_identifier_that_will_exceed_the_sixty_three_byte_limit" in snake_case
      // which is 78 characters (bytes for ASCII)
      const camelCaseIdentifier = 'aVeryLongCamelCaseIdentifierThatWillExceedTheSixtyThreeByteLimit'
      expect(() => {
        validateDatabaseIdentifierLength(camelCaseIdentifier, {
          isSnakeCase: false,
          identifierType: 'column name',
        })
      }).toThrow(IdentifierExceedsMaxLengthForDatabase)
    })
  })

  context('with a camelCase identifier that is safe in snake_case', () => {
    it('does not throw', () => {
      const camelCaseIdentifier = 'shortCamelCase'
      expect(() => {
        validateDatabaseIdentifierLength(camelCaseIdentifier, {
          isSnakeCase: false,
          identifierType: 'column name',
        })
      }).not.toThrow()
    })
  })

  context('with a realistic long index name', () => {
    it('throws for table_column combinations exceeding 63 bytes', () => {
      // Simulates an index name like "very_long_table_name_here_very_long_column_name_there_plus_extra_stuff"
      const indexName = 'very_long_table_name_here_very_long_column_name_there_plus_extra_stuff'
      expect(indexName.length).toBeGreaterThan(63)
      expect(() => {
        validateDatabaseIdentifierLength(indexName, { isSnakeCase: true, identifierType: 'index name' })
      }).toThrow(IdentifierExceedsMaxLengthForDatabase)
    })
  })

  context('error message', () => {
    it('includes the identifier, its snake_case form, and byte length', () => {
      const identifier = 'a'.repeat(64)
      try {
        validateDatabaseIdentifierLength(identifier, {
          isSnakeCase: true,
          identifierType: 'table name',
        })
        // should not reach here
        expect(true).toBe(false)
      } catch (err) {
        const error = err as IdentifierExceedsMaxLengthForDatabase
        expect(error).toBeInstanceOf(IdentifierExceedsMaxLengthForDatabase)
        expect(error.message).toContain('table name')
        expect(error.message).toContain('64 bytes')
        expect(error.message).toContain('63 bytes')
      }
    })
  })

  context('defaults', () => {
    it('defaults isSnakeCase to false and identifierType to "identifier"', () => {
      // This camelCase string becomes a very long snake_case string
      const camelCaseIdentifier = 'aVeryLongCamelCaseIdentifierThatWillExceedTheSixtyThreeByteLimit'
      try {
        validateDatabaseIdentifierLength(camelCaseIdentifier)
        expect(true).toBe(false)
      } catch (err) {
        const error = err as IdentifierExceedsMaxLengthForDatabase
        expect(error.identifierType).toEqual('identifier')
      }
    })
  })

  context('with custom maxLength', () => {
    it('does not throw when within the custom limit', () => {
      const identifier = 'a'.repeat(31)
      expect(() => {
        validateDatabaseIdentifierLength(identifier, {
          isSnakeCase: true,
          identifierType: 'table name',
          maxLength: 31,
        })
      }).not.toThrow()
    })

    it('throws when exceeding the custom limit', () => {
      const identifier = 'a'.repeat(32)
      expect(() => {
        validateDatabaseIdentifierLength(identifier, {
          isSnakeCase: true,
          identifierType: 'table name',
          maxLength: 31,
        })
      }).toThrow(IdentifierExceedsMaxLengthForDatabase)
    })

    it('includes the custom maxLength in the error', () => {
      const identifier = 'a'.repeat(32)
      try {
        validateDatabaseIdentifierLength(identifier, {
          isSnakeCase: true,
          identifierType: 'table name',
          maxLength: 31,
        })
        expect(true).toBe(false)
      } catch (err) {
        const error = err as IdentifierExceedsMaxLengthForDatabase
        expect(error.maxLength).toEqual(31)
        expect(error.message).toContain('31-byte component limit')
        expect(error.message).toContain('--table-name')
      }
    })

    it('uses 63-byte message format when maxLength is the default', () => {
      const identifier = 'a'.repeat(64)
      try {
        validateDatabaseIdentifierLength(identifier, {
          isSnakeCase: true,
          identifierType: 'table name',
        })
        expect(true).toBe(false)
      } catch (err) {
        const error = err as IdentifierExceedsMaxLengthForDatabase
        expect(error.maxLength).toEqual(63)
        expect(error.message).toContain('63 bytes')
        expect(error.message).not.toContain('component limit')
      }
    })
  })
})
