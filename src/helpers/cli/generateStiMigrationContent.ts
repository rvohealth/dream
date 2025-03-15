import { PrimaryKeyType } from '../../dream/types.js.js'
import generateMigrationContent from './generateMigrationContent.js.js'

export default function generateStiMigrationContent({
  table,
  columnsWithTypes = [],
  primaryKeyType = 'bigserial',
}: {
  table?: string
  columnsWithTypes?: string[]
  primaryKeyType?: PrimaryKeyType
} = {}) {
  return generateMigrationContent({ table, columnsWithTypes, primaryKeyType, createOrAlter: 'alter' })
}
