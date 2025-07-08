import Edge from '../../../../test-app/app/models/Graph/Edge.js'

describe('Dream#associationNames', () => {
  it('is an array with the names of all the associations defined on the model', () => {
    const edge = Edge.new()
    expect(edge.associationNames).toEqual(['edgeNodes', 'nodes'])
  })
})
