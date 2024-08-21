"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractValueFromJoinsPluckResponse = void 0;
const marshalDBValue_1 = require("../../helpers/marshalDBValue");
const extractValueFromJoinsPluckResponse = (val, index, pluckStatement, dreamClass, associationNameMap) => {
    const parts = pluckStatement[index].split('.');
    if (parts.length === 1 || parts[0] === dreamClass.prototype['table']) {
        const column = parts[0];
        return (0, marshalDBValue_1.marshalDBValue)(dreamClass, column, val);
    }
    else {
        const [associationName, column] = parts;
        return (0, marshalDBValue_1.marshalDBValue)(associationNameMap[associationName], column, val);
    }
};
exports.extractValueFromJoinsPluckResponse = extractValueFromJoinsPluckResponse;
