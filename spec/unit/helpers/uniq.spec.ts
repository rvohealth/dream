import uniq from '../../../src/helpers/uniq'
import GraphNode from '../../../test-app/app/models/Graph/Node'

describe('uniq', () => {
  let subject = () => uniq(array(), comparator)
  let comparator: ((a: any, b: any) => boolean) | undefined

  let item1: any
  let item2: any
  let item1Reloaded: any
  let array = () => [item1, item2, item1Reloaded]

  beforeEach(() => {
    comparator = undefined
  })

  context('when the first element is a Dream', () => {
    beforeEach(async () => {
      item1 = await GraphNode.create({ name: 'Hello' })
      item2 = await GraphNode.create({ name: 'Hello' })
      item1Reloaded = await GraphNode.find(item1.id)
    })

    it('uses the custom Dream comparator', async () => {
      expect(subject()).toMatchObject([item1, item2])
    })

    context('when a custom comparator is passed', () => {
      it('uses the custom comparator', async () => {
        comparator = (a, b) => a.name === b.name
        expect(subject()).toMatchObject([item1])
      })
    })
  })

  context('when the first element is not a Dream', () => {
    beforeEach(() => {
      item1 = 'hello'
      item2 = 'world'
      item1Reloaded = 'hello'
    })

    it('uses the standard lodash comparator', () => {
      expect(subject()).toMatchObject([item1, item2])
    })

    context('when a custom comparator is passed', () => {
      it('uses the custom comparator', async () => {
        comparator = (a, b) => a.constructor === b.constructor
        expect(subject()).toMatchObject([item1])
      })
    })
  })
})
