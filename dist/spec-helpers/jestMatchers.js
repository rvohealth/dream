"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectMatchingDreamModels = void 0;
const expect_utils_1 = require("@jest/expect-utils");
const lodash_sortby_1 = __importDefault(require("lodash.sortby"));
const jest_matcher_utils_1 = require("jest-matcher-utils");
const CalendarDate_1 = __importDefault(require("../src/helpers/CalendarDate"));
const EXPECTED_LABEL = 'Expected';
const RECEIVED_LABEL = 'Received';
const ERROR_COLOR = jest_matcher_utils_1.RECEIVED_COLOR;
expect.extend({
    toEqualCalendarDate(received, expected) {
        if (!(received instanceof CalendarDate_1.default)) {
            return {
                pass: false,
                message: () => `Expected received object to be an calendarDate, but was ${received?.constructor?.name}`,
            };
        }
        const pass = expected.equals(received);
        return {
            pass,
            message: () => pass
                ? `expected ${received.toISO()} NOT to equal ${expected.toISO()}`
                : `expected ${received.toISO()} to equal ${expected.toISO()}`,
        };
    },
    // https://stackoverflow.com/questions/50896753/jest-tobeclosetos-precision-not-working-as-expected#answer-75639525
    toBeWithin(received, precision, expected) {
        if (typeof received !== 'number') {
            throw new TypeError(`Received ${typeof received}, but expected number`);
        }
        const pass = Math.abs(received - expected) < precision;
        return {
            pass,
            message: () => pass
                ? `expected ${received} NOT to be within ${precision} of ${expected}`
                : `expected ${received} to be within ${precision} of ${expected}`,
        };
    },
    toMatchDreamModel(received, expected) {
        return expectMatchingDreamModels(received, expected, 'toMatchDreamModel');
    },
    toMatchDreamModels(received, expected) {
        if (!Array.isArray(received)) {
            return {
                pass: false,
                message: () => `Expected received object to be an Array, but was ${received?.constructor?.name}`,
            };
        }
        else if (!Array.isArray(expected)) {
            return {
                pass: false,
                message: () => `Expected expected object to be an Array, but was ${expected?.constructor?.name}`,
            };
        }
        else if (expected.length != received.length) {
            return {
                pass: false,
                message: () => `Expected arrays of the same length, but expected has ${expected.length} elements and received has ${received.length}`,
            };
        }
        else if (expected.length === 0) {
            return {
                pass: true,
                message: () => 'Expected arrays not to match, but both were empty',
            };
        }
        let results;
        received = (0, lodash_sortby_1.default)(received, received[0]?.primaryKey);
        expected = (0, lodash_sortby_1.default)(expected, expected[0]?.primaryKey);
        received.forEach((receivedElement, i) => {
            results = expectMatchingDreamModels(receivedElement, expected[i], 'toMatchDreamModels');
            if (!results.pass)
                return;
        });
        if (results.pass) {
            return {
                pass: true,
                message: () => 'Expected arrays of Dream objects not to match, but they do',
            };
        }
        else {
            return results;
        }
    },
});
function attributes(obj) {
    return { instanceof: obj.constructor.name, ...obj.attributes };
}
function expectMatchingDreamModels(received, expected, matcherName) {
    let pass = false;
    let message;
    if (expected === undefined) {
        message = () => ERROR_COLOR('expected is undefined but should be an instance of Dream');
    }
    else if (expected === null) {
        message = () => ERROR_COLOR('expected is null but should be an instance of Dream');
    }
    else if (typeof expected !== 'object') {
        message = () => ERROR_COLOR(`expected is ${expected.constructor.name} but must be an instance of Dream`);
    }
    else if (received === undefined) {
        message = () => ERROR_COLOR('received is undefined but should be an instance of Dream');
    }
    else if (received === null) {
        message = () => ERROR_COLOR('received is null but should be an instance of Dream');
    }
    else if (typeof received !== 'object') {
        message = () => ERROR_COLOR(`received is ${received.constructor.name} but must be an instance of Dream`);
    }
    else if (expected.constructor !== received.constructor) {
        message = () => (0, jest_matcher_utils_1.EXPECTED_COLOR)(`expected ${expected.constructor.name}, `) +
            (0, jest_matcher_utils_1.RECEIVED_COLOR)(`received ${received.constructor.name}`);
    }
    else if (expected.primaryKeyValue !== received.primaryKeyValue) {
        message = () => (0, jest_matcher_utils_1.EXPECTED_COLOR)(`expected is ${expected.constructor.name} with primary key ${expected.primaryKeyValue}\n`) +
            (0, jest_matcher_utils_1.RECEIVED_COLOR)(`received is ${received.constructor.name} with primary key ${received.primaryKeyValue}`);
    }
    else {
        const comparableReceived = attributes(received);
        const comparableExpected = attributes(expected);
        pass = JSON.stringify(comparableReceived) === JSON.stringify(comparableExpected);
        message = pass
            ? () => (0, jest_matcher_utils_1.matcherHint)(matcherName) +
                '\n\n' +
                `Expected: not ${(0, jest_matcher_utils_1.printExpected)(comparableExpected)}` +
                ((0, jest_matcher_utils_1.stringify)(comparableExpected) !== (0, jest_matcher_utils_1.stringify)(comparableReceived)
                    ? `\nReceived:     ${(0, jest_matcher_utils_1.printReceived)(comparableReceived)}`
                    : '')
            : () => (0, jest_matcher_utils_1.matcherHint)(matcherName) +
                '\n\n' +
                (0, jest_matcher_utils_1.printDiffOrStringify)((0, jest_matcher_utils_1.stringify)(comparableExpected), (0, expect_utils_1.getObjectSubset)((0, jest_matcher_utils_1.stringify)(comparableReceived), (0, jest_matcher_utils_1.stringify)(comparableExpected)), EXPECTED_LABEL, RECEIVED_LABEL, false);
    }
    return { message, pass };
}
exports.expectMatchingDreamModels = expectMatchingDreamModels;
