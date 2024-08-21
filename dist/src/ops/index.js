"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const kysely_1 = require("kysely");
const any_requires_array_column_1 = __importDefault(require("../exceptions/ops/any-requires-array-column"));
const isDatabaseArrayColumn_1 = __importDefault(require("../helpers/db/types/isDatabaseArrayColumn"));
const curried_ops_statement_1 = __importDefault(require("./curried-ops-statement"));
const ops_statement_1 = __importDefault(require("./ops-statement"));
const ops = {
    expression: (operator, value) => new ops_statement_1.default(operator, value),
    in: (arr) => new ops_statement_1.default('in', arr),
    any: (value) => new curried_ops_statement_1.default(function (dreamClass, fieldName) {
        const column = fieldName.replace(/^.*\./, '');
        if (!(0, isDatabaseArrayColumn_1.default)(dreamClass, column))
            throw new any_requires_array_column_1.default(dreamClass, column);
        const castType = dreamClass['cachedTypeFor'](column);
        return new ops_statement_1.default('@>', (0, kysely_1.sql) `ARRAY[${kysely_1.sql.join([value])}]::${kysely_1.sql.raw(castType)}`);
    }),
    like: (like) => new ops_statement_1.default('like', like),
    ilike: (ilike) => new ops_statement_1.default('ilike', ilike),
    match: (match, { caseInsensitive = false } = {}) => new ops_statement_1.default(caseInsensitive ? '~*' : '~', match),
    equal: (equal) => new ops_statement_1.default('=', equal),
    lessThan: (lessThan) => new ops_statement_1.default('<', lessThan),
    lessThanOrEqualTo: (lessThanOrEqualTo) => new ops_statement_1.default('<=', lessThanOrEqualTo),
    greaterThan: (greaterThan) => new ops_statement_1.default('>', greaterThan),
    greaterThanOrEqualTo: (greaterThanOrEqualTo) => new ops_statement_1.default('>=', greaterThanOrEqualTo),
    similarity: (similarity, { score = 0.3 } = {}) => new ops_statement_1.default('%', similarity, { score }),
    wordSimilarity: (similarity, { score = 0.5 } = {}) => new ops_statement_1.default('<%', similarity, { score }),
    strictWordSimilarity: (similarity, { score = 0.6 } = {}) => new ops_statement_1.default('<<%', similarity, { score }),
    not: {
        in: (arr) => new ops_statement_1.default('not in', arr, { negated: true }),
        like: (like) => new ops_statement_1.default('not like', like, { negated: true }),
        ilike: (ilike) => new ops_statement_1.default('not ilike', ilike, { negated: true }),
        match: (match, { caseInsensitive = false } = {}) => new ops_statement_1.default(caseInsensitive ? '!~*' : '!~', match, { negated: true }),
        equal: (equal) => new ops_statement_1.default('!=', equal, { negated: true }),
        lessThan: (lessThan) => new ops_statement_1.default('!<', lessThan, { negated: true }),
    },
};
exports.default = ops;
