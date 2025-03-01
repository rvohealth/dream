import uniq from '../../../src/helpers/uniq'
import GraphNode from '../../../test-app/app/models/Graph/Node'

describe('uniq', () => {
  const subject = () => uniq(array(), toKey)
  let toKey: ((a: any) => string) | undefined

  let item1: any
  let item2: any
  let item1Reloaded: any
  const array = () => [item1, item2, item1Reloaded]

  beforeEach(() => {
    toKey = undefined
  })

  context('when the first element is a Dream', () => {
    beforeEach(async () => {
      item1 = await GraphNode.create({ name: 'Hello' })
      item2 = await GraphNode.create({ name: 'Hello' })
      item1Reloaded = await GraphNode.find(item1.id)
    })

    it('uses the custom Dream comparator', () => {
      expect(subject()).toMatchObject([item1, item2])
    })

    context('when a custom comparator is passed', () => {
      it('uses the custom comparator', () => {
        toKey = a => a.name
        expect(subject()).toMatchObject([item1])
      })
    })
  })

  context('when the first element is not a Dream', () => {
    beforeEach(() => {
      item1 = 'world'
      item2 = 'hello'
      item1Reloaded = 'hello'
    })

    it('uses the standard lodash comparator', () => {
      expect(subject()).toMatchObject([item1, item2])
    })

    context('when a custom comparator is passed', () => {
      it('uses the custom comparator', () => {
        toKey = a => a.constructor.name
        expect(subject()).toMatchObject([item1])
      })
    })
  })
})
