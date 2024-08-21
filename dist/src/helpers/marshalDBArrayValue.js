"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const attempting_to_marshal_invalid_array_type_1 = __importDefault(require("../exceptions/attempting-to-marshal-invalid-array-type"));
const typechecks_1 = require("./typechecks");
function marshalDBArrayValue(dreamClass, value) {
    if (value === null)
        return null;
    if (value === undefined)
        return undefined;
    if (Array.isArray(value)) {
        return value;
    }
    else if ((0, typechecks_1.isString)(value)) {
        return parsePostgresArray(value, (val) => val);
    }
    else {
        throw new attempting_to_marshal_invalid_array_type_1.default(value);
    }
}
exports.default = marshalDBArrayValue;
// copied and adapted from:
// https://github.com/bendrucker/postgres-array/blob/master/index.js
// if anyone finds a better typescript approach to serializing PG arrays,
// swap it out here. My first attempt at this was:
//
// return (value as string)
//   .replace(/^\{/, '')
//   .replace(/\}$/, '')
//   .split(/\s?,\s?/) as Table[Attr]
//
// but it was too simple to handle really complex enum values (i.e. values that contained commas and special chars)
function parsePostgresArray(source, transform, nested = false) {
    let character = '';
    let quote = false;
    let position = 0;
    let dimension = 0;
    const entries = [];
    let recorded = '';
    const newEntry = function (includeEmpty = false) {
        let entry = recorded;
        if (entry.length > 0 || includeEmpty) {
            if (entry === 'NULL' && !includeEmpty) {
                entry = null;
            }
            if (entry !== null && transform) {
                entry = transform(entry);
            }
            entries.push(entry);
            recorded = '';
        }
    };
    if (source[0] === '[') {
        while (position < source.length) {
            const char = source[position++];
            if (char === '=') {
                break;
            }
        }
    }
    while (position < source.length) {
        let escaped = false;
        character = source[position++];
        if (character === '\\') {
            character = source[position++];
            escaped = true;
        }
        if (character === '{' && !quote) {
            dimension++;
            if (dimension > 1) {
                const parser = parsePostgresArray(source.substr(position - 1), transform, true);
                entries.push(parser.entries);
                position += parser.position - 2;
            }
        }
        else if (character === '}' && !quote) {
            dimension--;
            if (!dimension) {
                newEntry();
                if (nested) {
                    return {
                        entries,
                        position,
                    };
                }
            }
        }
        else if (character === '"' && !escaped) {
            if (quote) {
                newEntry(true);
            }
            quote = !quote;
        }
        else if (character === ',' && !quote) {
            newEntry();
        }
        else {
            recorded += character;
        }
    }
    if (dimension !== 0) {
        throw new Error('array dimension not balanced');
    }
    return entries;
}
