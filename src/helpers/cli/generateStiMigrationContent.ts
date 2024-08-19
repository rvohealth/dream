import { PrimaryKeyType } from '../../dream/types'
import generateMigrationContent from './generateMigrationContent'

export default function generateStiMigrationContent({
  table,
  attributes = [],
  primaryKeyType = 'bigserial',
}: {
  table?: string
  attributes?: string[]
  primaryKeyType?: PrimaryKeyType
} = {}) {
  return generateMigrationContent({ table, attributes, primaryKeyType, createOrAlter: 'alter' })
}
