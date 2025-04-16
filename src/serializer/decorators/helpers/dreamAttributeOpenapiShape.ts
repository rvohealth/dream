import Dream from '../../../Dream.js'
import { DbTypes } from '../../../types/db.js'
import { DreamClassColumnNames } from '../../../types/dream.js'
import { OpenapiSchemaBody } from '../../../types/openapi.js'

interface DreamColumnInfo {
  enumValues: string[] | null
  dbType: DbTypes
  allowNull: boolean
  isArray: boolean
}

export function dreamAttributeOpenapiShape<DreamClass extends typeof Dream>(
  dreamClass: DreamClass,
  column: DreamClassColumnNames<DreamClass>
): OpenapiSchemaBody {
  const dream = dreamClass.prototype
  const dreamColumnInfo: DreamColumnInfo = dream.schema[dream.table]?.columns[column]

  if (!dreamColumnInfo) return { type: 'string' }

  const singleType = singularAttributeOpenapiShape(dreamColumnInfo)

  if (dreamColumnInfo.isArray)
    return { type: dreamColumnInfo.allowNull ? ['array', 'null'] : 'array', items: singleType }

  return {
    ...singleType,
    type: dreamColumnInfo.allowNull ? [singleType.type, 'null'] : singleType.type,
  } as OpenapiSchemaBody
}

function singularAttributeOpenapiShape(dreamColumnInfo: DreamColumnInfo) {
  if (dreamColumnInfo.enumValues) return { type: 'string', enum: dreamColumnInfo.enumValues } as const

  switch (dreamColumnInfo.dbType.replace('[]', '')) {
    case 'boolean':
      return { type: 'boolean' } as const

    case 'bigint':
    case 'bigserial':
    case 'bytea':
    case 'char':
    case 'character varying':
    case 'character':
    case 'cidr':
    case 'citext':
    case 'inet':
    case 'macaddr':
    case 'money':
    case 'path':
    case 'text':
    case 'uuid':
    case 'varbit':
    case 'varchar':
    case 'xml':
      return { type: 'string' } as const

    case 'integer':
    case 'serial':
    case 'smallint':
    case 'smallserial':
      return { type: 'integer' } as const

    case 'decimal':
    case 'numeric':
      return { type: 'number', format: 'decimal' } as const

    case 'double':
    case 'real':
      return { type: 'number' } as const

    case 'datetime':
    case 'time':
    case 'time with time zone':
    case 'timestamp':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return { type: 'string', format: 'date-time' } as const

    case 'date':
      return { type: 'string', format: 'date' } as const

    case 'json':
    case 'jsonb':
      throw new UseCustomOpenapiForJson()

    default:
      throw new Error(
        `Unrecognized dbType used in serializer OpenAPI type declaration: ${dreamColumnInfo.dbType}`
      )
  }
}

export class UseCustomOpenapiForJson extends Error {
  public override get message() {
    return `Use custom OpenAPI declaration (OpenapiSchemaBodyShorthand) to define shape of json and jsonb fields`
  }
}
