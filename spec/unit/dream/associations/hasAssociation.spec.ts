import Edge from '../../../../test-app/app/models/Graph/Edge.js'

describe('Dream#hasAssociation', () => {
  context('when an association with the given name exists on the Dream', () => {
    it('is true', () => {
      const edge = Edge.new()
      expect(edge.hasAssociation('nodes')).toBe(true)
    })
  })

  context('when an association with the given name does not exist on the Dream', () => {
    it('is false', () => {
      const edge = Edge.new()
      expect(edge.hasAssociation('node5')).toBe(false)
    })
  })
})
