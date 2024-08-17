import Dream from '../../../dream'
import { DreamClassColumnNames } from '../../../dream/types'
import { OpenapiSchemaBody } from '../../../openapi/types'

type DbTypes =
  | 'bigint'
  | 'bigint[]'
  | 'boolean'
  | 'boolean[]'
  | 'character varying'
  | 'character varying[]'
  | 'citext'
  | 'citext[]'
  | 'date'
  | 'date[]'
  | 'integer'
  | 'integer[]'
  | 'json'
  | 'json[]'
  | 'jsonb'
  | 'jsonb[]'
  | 'numeric'
  | 'numeric[]'
  | 'pet_treats_enum[]'
  | 'species_types_enum'
  | 'text'
  | 'text[]'
  | 'timestamp'
  | 'timestamp[]'
  | 'timestamp without time zone'
  | 'timestamp without time zone[]'
  | 'uuid'
  | 'uuid[]'

interface DreamColumnInfo {
  enumValues: string[] | null
  dbType: DbTypes
  allowNull: boolean
  isArray: boolean
}

export function dreamAttributeOpenApiShape<DreamClass extends typeof Dream>(
  dreamClass: DreamClass,
  column: DreamClassColumnNames<DreamClass>
): OpenapiSchemaBody {
  const dream = dreamClass.prototype
  const dreamColumnInfo: DreamColumnInfo = dream.schema[dream.table]?.columns[column]

  if (!dreamColumnInfo)
    throw new Error(`
Attempted automatic OpenAPI serialization on non-Dream column:
Class: ${dreamClass.name}
Column: ${column}
`)

  const singleType = singularAttributeOpenApiShape(dreamColumnInfo)
  const nullable = dreamColumnInfo.allowNull ? { nullable: true } : {}

  if (dreamColumnInfo.isArray) return { type: 'array', items: singleType, ...nullable }

  return {
    ...singleType,
    ...nullable,
  }
}

function singularAttributeOpenApiShape(dreamColumnInfo: DreamColumnInfo): OpenapiSchemaBody {
  if (dreamColumnInfo.enumValues) return { type: 'string', enum: dreamColumnInfo.enumValues }

  switch (dreamColumnInfo.dbType.replace('[]', '')) {
    case 'boolean':
      return { type: 'boolean' }

    case 'bigint':
    case 'character varying':
    case 'citext':
    case 'text':
    case 'uuid':
      return { type: 'string' }

    case 'integer':
      return { type: 'integer' }

    case 'numeric':
      return { type: 'number', format: 'decimal' }

    case 'timestamp':
    case 'timestamp without time zone':
      return { type: 'string', format: 'date-time' }

    case 'date':
      return { type: 'string', format: 'date' }

    case 'json':
    case 'jsonb':
      throw new UseCustomOpenApiForJson()

    default:
      throw new Error(
        `Unrecognized dbType used in serializer OpenAPI type declaration: ${dreamColumnInfo.dbType}`
      )
  }
}

export class UseCustomOpenApiForJson extends Error {
  public get message() {
    return `Use custom OpenAPI declaration (OpenapiSchemaBodyShorthand) to define shape of json and jsonb fields`
  }
}
