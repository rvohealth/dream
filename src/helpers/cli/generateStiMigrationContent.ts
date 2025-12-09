import { LegacyCompatiblePrimaryKeyType } from '../../types/db.js'
import generateMigrationContent from './generateMigrationContent.js'

export default function generateStiMigrationContent({
  table,
  columnsWithTypes = [],
  primaryKeyType = 'bigserial',
  stiChildClassName,
}: {
  table?: string
  columnsWithTypes?: string[]
  primaryKeyType?: LegacyCompatiblePrimaryKeyType
  stiChildClassName?: string
}) {
  return generateMigrationContent({
    table,
    columnsWithTypes,
    primaryKeyType,
    createOrAlter: 'alter',
    stiChildClassName,
  })
}
