import { PrimaryKeyType } from '../../types/dream.js'
import generateMigrationContent from './generateMigrationContent.js'

export default function generateStiMigrationContent({
  table,
  columnsWithTypes = [],
  primaryKeyType = 'bigserial',
  stiChildClassName,
}: {
  table?: string
  columnsWithTypes?: string[]
  primaryKeyType?: PrimaryKeyType
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
