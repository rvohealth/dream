import cloneDeepSafe, { TypeUnsupportedByClone } from '../../../src/helpers/cloneDeepSafe'
import Latex from '../../../test-app/app/models/Balloon/Latex'

describe('cloneDeepSafe', () => {
  context("['hello', { world: 'goodbye' }]", () => {
    it('is identical, but not the same objects', () => {
      const original: ['hello', { world: 'goodbye' }] = ['hello', { world: 'goodbye' }]
      const clone = cloneDeepSafe(original)

      expect(clone[0]).toEqual('hello')
      expect(clone[1].world).toEqual('goodbye')

      expect(clone[1]).not.toBe(original[1])
    })
  })

  context('a Dream instance', () => {
    it('is the duped Dream instance', async () => {
      const original = await Latex.create({ color: 'red' })
      const clone = cloneDeepSafe(original)

      expect(clone.color).toEqual('red')
      expect(clone.isPersisted).toBe(false)
      expect(clone.primaryKeyValue).toBeUndefined()
    })
  })

  context('a Set', () => {
    it('throws TypeUnsupportedByClone', async () => {
      const original = [new Set()]
      expect(() => cloneDeepSafe(original)).toThrow(TypeUnsupportedByClone)
    })
  })
})
