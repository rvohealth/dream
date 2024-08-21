"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseCustomOpenapiForJson = exports.dreamAttributeOpenapiShape = void 0;
function dreamAttributeOpenapiShape(dreamClass, column) {
    const dream = dreamClass.prototype;
    const dreamColumnInfo = dream.schema[dream.table]?.columns[column];
    if (!dreamColumnInfo)
        return { type: 'string' };
    const singleType = singularAttributeOpenapiShape(dreamColumnInfo);
    const nullable = dreamColumnInfo.allowNull ? { nullable: true } : {};
    if (dreamColumnInfo.isArray)
        return { type: 'array', items: singleType, ...nullable };
    return {
        ...singleType,
        ...nullable,
    };
}
exports.dreamAttributeOpenapiShape = dreamAttributeOpenapiShape;
function singularAttributeOpenapiShape(dreamColumnInfo) {
    if (dreamColumnInfo.enumValues)
        return { type: 'string', enum: dreamColumnInfo.enumValues };
    switch (dreamColumnInfo.dbType.replace('[]', '')) {
        case 'boolean':
            return { type: 'boolean' };
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
            return { type: 'string' };
        case 'integer':
        case 'serial':
        case 'smallint':
        case 'smallserial':
            return { type: 'integer' };
        case 'decimal':
        case 'numeric':
            return { type: 'number', format: 'decimal' };
        case 'double':
        case 'real':
            return { type: 'number' };
        case 'datetime':
        case 'time':
        case 'time with time zone':
        case 'timestamp':
        case 'timestamp with time zone':
        case 'timestamp without time zone':
            return { type: 'string', format: 'date-time' };
        case 'date':
            return { type: 'string', format: 'date' };
        case 'json':
        case 'jsonb':
            throw new UseCustomOpenapiForJson();
        default:
            throw new Error(`Unrecognized dbType used in serializer OpenAPI type declaration: ${dreamColumnInfo.dbType}`);
    }
}
class UseCustomOpenapiForJson extends Error {
    get message() {
        return `Use custom OpenAPI declaration (OpenapiSchemaBodyShorthand) to define shape of json and jsonb fields`;
    }
}
exports.UseCustomOpenapiForJson = UseCustomOpenapiForJson;
