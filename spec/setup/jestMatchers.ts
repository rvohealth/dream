import { getObjectSubset } from '@jest/expect-utils'
import sortBy from 'lodash.sortby'
import {
  EXPECTED_COLOR,
  RECEIVED_COLOR,
  matcherErrorMessage,
  matcherHint,
  printDiffOrStringify,
  printExpected,
  printReceived,
  printWithType,
  stringify,
} from 'jest-matcher-utils'
import Dream from '../../src/dream'

const EXPECTED_LABEL = 'Expected'
const RECEIVED_LABEL = 'Received'
const ERROR_COLOR = RECEIVED_COLOR
const isExpand = (expand?: boolean): boolean => expand !== false

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchDreamModel(expected: any): CustomMatcherResult
      toMatchDreamModels(expected: any): CustomMatcherResult
      toBeWithin(precision: number, expected: number): CustomMatcherResult
    }
  }
}

expect.extend({
  // https://stackoverflow.com/questions/50896753/jest-tobeclosetos-precision-not-working-as-expected#answer-75639525
  toBeWithin(received: number, precision: number, expected: number) {
    const pass = Math.abs(received - expected) < precision
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} NOT to be within ${precision} of ${expected}`
          : `expected ${received} to be within ${precision} of ${expected}`,
    }
  },

  toMatchDreamModel(received: any, expected: any) {
    return expectMatchingDreamModels(received, expected, 'toMatchDreamModel')
  },

  toMatchDreamModels(received: any, expected: any) {
    if (!Array.isArray(received)) {
      return {
        pass: false,
        message: () => `Expected received object to be an Array, but was ${received?.constructor?.name}`,
      }
    } else if (!Array.isArray(expected)) {
      return {
        pass: false,
        message: () => `Expected expected object to be an Array, but was ${expected?.constructor?.name}`,
      }
    } else if (expected.length != received.length) {
      return {
        pass: false,
        message: () =>
          `Expected arrays of the same length, but expected has ${expected.length} elements and received has ${received.length}`,
      }
    } else if (expected.length === 0) {
      return {
        pass: true,
        message: () => 'Expected arrays not to match, but both were empty',
      }
    }

    let results: jest.CustomMatcherResult

    received = sortBy(received, received[0]?.primaryKey)
    expected = sortBy(expected, expected[0]?.primaryKey)

    received.forEach((receivedElement: Dream, i: number) => {
      results = expectMatchingDreamModels(receivedElement, expected[i], 'toMatchDreamModels')
      if (!results.pass) return
    })

    if (results!.pass) {
      return {
        pass: true,
        message: () => 'Expected arrays of Dream objects not to match, but they do',
      }
    } else {
      return results!
    }
  },
})

function attributes(obj: any) {
  return { instanceof: obj.constructor.name, ...obj.attributes }
}

export function expectMatchingDreamModels(
  received: any,
  expected: any,
  matcherName: string
): jest.CustomMatcherResult {
  let pass: boolean = false
  let message: () => string

  if (expected === undefined) {
    message = () => ERROR_COLOR('expected is undefined but should be an instance of Dream')
  } else if (expected === null) {
    message = () => ERROR_COLOR('expected is null but should be an instance of Dream')
  } else if (typeof expected !== 'object') {
    message = () => ERROR_COLOR(`expected is ${expected.constructor.name} but must be an instance of Dream`)
  } else if (received === undefined) {
    message = () => ERROR_COLOR('received is undefined but should be an instance of Dream')
  } else if (received === null) {
    message = () => ERROR_COLOR('received is null but should be an instance of Dream')
  } else if (typeof received !== 'object') {
    message = () => ERROR_COLOR(`received is ${received.constructor.name} but must be an instance of Dream`)
  } else if (expected.constructor !== received.constructor) {
    message = () =>
      EXPECTED_COLOR(`expected ${expected.constructor.name}, `) +
      RECEIVED_COLOR(`received ${received.constructor.name}`)
  } else if (expected.primaryKeyValue !== received.primaryKeyValue) {
    message = () =>
      EXPECTED_COLOR(
        `expected is ${expected.constructor.name} with primary key ${expected.primaryKeyValue}\n`
      ) +
      RECEIVED_COLOR(`received is ${received.constructor.name} with primary key ${received.primaryKeyValue}`)
  } else {
    const comparableReceived = attributes(received)
    const comparableExpected = attributes(expected)
    pass = JSON.stringify(comparableReceived) === JSON.stringify(comparableExpected)

    message = pass
      ? () =>
          // eslint-disable-next-line prefer-template
          matcherHint(matcherName) +
          '\n\n' +
          `Expected: not ${printExpected(comparableExpected)}` +
          (stringify(comparableExpected) !== stringify(comparableReceived)
            ? `\nReceived:     ${printReceived(comparableReceived)}`
            : '')
      : () =>
          // eslint-disable-next-line prefer-template
          matcherHint(matcherName) +
          '\n\n' +
          printDiffOrStringify(
            stringify(comparableExpected),
            getObjectSubset(stringify(comparableReceived), stringify(comparableExpected)),
            EXPECTED_LABEL,
            RECEIVED_LABEL,
            false
          )
  }

  return { message, pass }
}
