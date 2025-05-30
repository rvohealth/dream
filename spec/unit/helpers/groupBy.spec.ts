import groupBy from '../../../src/helpers/groupBy.js'
import GraphNode from '../../../test-app/app/models/Graph/Node.js'

describe('groupBy', () => {
  it('can group strings', () => {
    expect(groupBy(['Hello', 'World', 'Hello'], (a: string) => a)).toEqual({
      Hello: ['Hello', 'Hello'],
      World: ['World'],
    })
  })

  it('can group Dream models', async () => {
    const graphNode1 = await GraphNode.create({ name: 'Hello' })
    const graphNode2 = await GraphNode.create({ name: 'Goodbye' })
    const graphNode3 = await GraphNode.create({ name: 'Hello' })

    const results = groupBy([graphNode1, graphNode2, graphNode3], (a: GraphNode) => a.name ?? '')

    expect(Object.keys(results)).toHaveLength(2)

    expect(results['Hello']).toMatchDreamModels([graphNode1, graphNode3])
    expect(results['Goodbye']).toMatchDreamModels([graphNode2])
  })
})
