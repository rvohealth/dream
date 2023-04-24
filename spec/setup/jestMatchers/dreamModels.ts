import { expectMatchingDreamModels } from './dreamModel'

expect.extend({
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
