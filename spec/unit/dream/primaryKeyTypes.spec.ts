import { primaryKeyTypes } from '../../../src/dream/constants.js'
import foreignKeyTypeFromPrimaryKey from '../../../src/dream/QueryDriver/helpers/kysely/foreignKeyTypeFromPrimaryKey.js'
import { LegacyCompatiblePrimaryKeyType } from '../../../src/types/db.js'

describe('primaryKeyTypes (canonical, advertised set)', () => {
  it('advertises exactly the four canonical primary key types', () => {
    expect(primaryKeyTypes).toEqual(['uuid7', 'uuid4', 'bigint', 'integer'])
  })

  it('no longer advertises the legacy bigserial alias', () => {
    expect(primaryKeyTypes).not.toContain('bigserial')
  })

  context('backward compatibility', () => {
    it('still accepts the legacy "bigserial" value and maps its foreign key to bigint', () => {
      // type-level acceptance: bigserial remains assignable to the configured-value type
      const legacy: LegacyCompatiblePrimaryKeyType = 'bigserial'
      expect(foreignKeyTypeFromPrimaryKey(legacy)).toEqual('bigint')
    })
  })
})
