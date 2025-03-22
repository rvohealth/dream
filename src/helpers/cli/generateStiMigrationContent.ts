import { PrimaryKeyType } from '../../types/dream.js'
import generateMigrationContent from './generateMigrationContent.js'

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
