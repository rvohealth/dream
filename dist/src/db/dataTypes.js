"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgresDatatypes = exports.isPrimitiveDataType = void 0;
function dataTypes() {
    // In the future, when we support multiple db drivers,
    // this will need to be updated
    return exports.postgresDatatypes;
}
exports.default = dataTypes;
function isPrimitiveDataType(type) {
    return dataTypes().includes(type.replace(/\[\]$/, ''));
}
exports.isPrimitiveDataType = isPrimitiveDataType;
exports.postgresDatatypes = [
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
];
