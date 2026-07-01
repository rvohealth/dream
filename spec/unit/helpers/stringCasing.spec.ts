import MaxRecursiveStringCaseDepthExceeded from '../../../src/errors/MaxRecursiveStringCaseDepthExceeded.js'
import camelize from '../../../src/helpers/camelize.js'
import snakeify from '../../../src/helpers/snakeify.js'

function buildDeeplyNested(depth: number): Record<string, any> {
  let obj: Record<string, any> = { leafValue: 1 }
  for (let i = 0; i < depth; i++) {
    obj = { nestedChild: obj }
  }
  return obj
}

describe('recursiveStringCase depth cap', () => {
  context('when the input is nested more deeply than the cap', () => {
    it('snakeify throws a controlled MaxRecursiveStringCaseDepthExceeded error (not a raw RangeError)', () => {
      const deeplyNested = buildDeeplyNested(5000)

      let caught: unknown
      try {
        snakeify(deeplyNested)
      } catch (error) {
        caught = error
      }

      expect(caught).toBeInstanceOf(MaxRecursiveStringCaseDepthExceeded)
      expect(caught).not.toBeInstanceOf(RangeError)
    })

    it('camelize throws a controlled MaxRecursiveStringCaseDepthExceeded error (not a raw RangeError)', () => {
      const deeplyNested = buildDeeplyNested(5000)

      let caught: unknown
      try {
        camelize(deeplyNested)
      } catch (error) {
        caught = error
      }

      expect(caught).toBeInstanceOf(MaxRecursiveStringCaseDepthExceeded)
      expect(caught).not.toBeInstanceOf(RangeError)
    })
  })

  context('when the input is nested within normal, legitimate depth', () => {
    it('snakeify processes it without throwing', () => {
      const realisticallyNested = {
        outerKey: {
          innerList: [{ deepKey: 'deepValue' }, 'plainString'],
          innerObject: { deeperKey: { deepestKey: 'value' } },
        },
      }

      expect(snakeify(realisticallyNested)).toEqual({
        outer_key: {
          inner_list: [{ deep_key: 'deepValue' }, 'plainString'],
          inner_object: { deeper_key: { deepest_key: 'value' } },
        },
      })
    })

    it('does not throw for an object nested just under the cap', () => {
      const underCap = buildDeeplyNested(400)
      expect(() => snakeify(underCap)).not.toThrow()
    })
  })
})
