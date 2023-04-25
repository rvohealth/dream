import { getObjectSubset } from '@jest/expect-utils'
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

const EXPECTED_LABEL = 'Expected'
const RECEIVED_LABEL = 'Received'
const isExpand = (expand?: boolean): boolean => expand !== false

declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchDreamModel(expected: any): CustomMatcherResult
      toMatchDreamModels(expected: any): CustomMatcherResult
    }
  }
}

expect.extend({
  toMatchDreamModel(received: any, expected: any) {
    return expectMatchingDreamModels(received, expected, 'toMatchDreamModel')

    //     if (!received?.isDreamInstance) {
    //       return {
    //         pass: false,
    //         message: () =>
    //           `Expected received object to be a Dream instance, but was ${received?.constructor?.name}`,
    //       }
    //     } else if (!expected?.isDreamInstance) {
    //       return {
    //         pass: false,
    //         message: () =>
    //           `Expected expected object to be a Dream instance, but was ${expected?.constructor?.name}`,
    //       }
    //     } else if (!attributesMatch(received, expected)) {
    //       return {
    //         pass: false,
    //         message: () => `
    // Expected
    // ${JSON.stringify(attributes(received), null, 2)}
    // to match
    // ${JSON.stringify(attributes(expected), null, 2)}`,
    //       }
    //     }

    //     return {
    //       pass: true,
    //       message: () => `
    // Expected
    // ${JSON.stringify(attributes(received), null, 2)}
    // NOT to match
    // ${JSON.stringify(attributes(expected), null, 2)}`,
    //     }
  },

  toMatchDreamModels(received: any, expected: any) {
    if (received?.constructor !== Array) {
      return {
        pass: false,
        message: () => `Expected received object to be an Array, but was ${received?.constructor?.name}`,
      }
    } else if (expected?.constructor !== Array) {
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

    received.forEach((receivedElement, i) => {
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

function attributes(object: any) {
  return { instanceof: object.constructor.name, ...object.attributes }
}

function attributesMatch(received: any, expected: any) {
  return attributes(received) !== attributes(expected)
}

export function expectMatchingDreamModels(
  received: object,
  expected: object,
  matcherName: string
): jest.CustomMatcherResult {
  if (typeof received !== 'object' || received === null) {
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherName),
        `${RECEIVED_COLOR('received')} value must be a non-null object`,
        printWithType('Received', received, printReceived)
      )
    )
  }

  if (typeof expected !== 'object' || expected === null) {
    throw new Error(
      matcherErrorMessage(
        matcherHint(matcherName),
        `${EXPECTED_COLOR('expected')} value must be a non-null object`,
        printWithType('Expected', expected, printExpected)
      )
    )
  }

  const pass = attributesMatch(received, expected)

  const message = pass
    ? () =>
        // eslint-disable-next-line prefer-template
        matcherHint(matcherName) +
        '\n\n' +
        `Expected: not ${printExpected(expected)}` +
        (stringify(attributes(expected)) !== stringify(attributes(received))
          ? `\nReceived:     ${printReceived(attributes(received))}`
          : '')
    : () =>
        // eslint-disable-next-line prefer-template
        matcherHint(matcherName) +
        '\n\n' +
        printDiffOrStringify(
          expected,
          getObjectSubset(attributes(received), attributes(expected)),
          EXPECTED_LABEL,
          RECEIVED_LABEL,
          false
        )

  return { message, pass }
}
