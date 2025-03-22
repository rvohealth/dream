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
  const nullable = dreamColumnInfo.allowNull ? { nullable: true } : {}

  if (dreamColumnInfo.isArray) return { type: 'array', items: singleType, ...nullable }

  return {
    ...singleType,
    ...nullable,
  }
}

function singularAttributeOpenapiShape(dreamColumnInfo: DreamColumnInfo): OpenapiSchemaBody {
  if (dreamColumnInfo.enumValues)
    return {
      type: 'string',
      enum: [...dreamColumnInfo.enumValues, ...(dreamColumnInfo.allowNull ? ['null'] : [])],
    }

  switch (dreamColumnInfo.dbType.replace('[]', '')) {
    case 'boolean':
      return { type: 'boolean' }

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
      return { type: 'string' }

    case 'integer':
    case 'serial':
    case 'smallint':
    case 'smallserial':
      return { type: 'integer' }

    case 'decimal':
    case 'numeric':
      return { type: 'number', format: 'decimal' }

    case 'double':
    case 'real':
      return { type: 'number' }

    case 'datetime':
    case 'time':
    case 'time with time zone':
    case 'timestamp':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return { type: 'string', format: 'date-time' }

    case 'date':
      return { type: 'string', format: 'date' }

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
  public get message() {
    return `Use custom OpenAPI declaration (OpenapiSchemaBodyShorthand) to define shape of json and jsonb fields`
  }
}
