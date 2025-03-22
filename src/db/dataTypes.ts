import { type NonArrayDbTypes } from '../types/db.js'

export default function dataTypes() {
  // In the future, when we support multiple db drivers,
  // this will need to be updated
  return postgresDatatypes
}

export function isPrimitiveDataType(type: string) {
  return dataTypes().includes(type.replace(/\[\]$/, '') as NonArrayDbTypes)
}

export const postgresDatatypes = [
  'bigint',
  'bigserial',
  'bit',
  'bit varying',
  'boolean',
  'box',
  'bytea',
  'character',
  'character varying',
  'char',
  'cidr',
  'circle',
  'citext',
  'date',
  'double precision',
  'inet',
  'integer',
  'interval',
  'json',
  'jsonb',
  'line',
  'lseg',
  'macaddr',
  'money',
  'numeric',
  'path',
  'point',
  'polygon',
  'real',
  'smallint',
  'smallserial',
  'serial',
  'text',
  'time',
  'time with time zone',
  'timestamp',
  'timestamp with time zone',
  'timestamp without time zone',
  'tsquery',
  'tsvector',
  'txid_snapshot',
  'uuid',
  'xml',
] as const
