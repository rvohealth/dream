import { PrimaryKeyType } from '../../dream/types'
import generateMigrationContent from './generateMigrationContent'

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
