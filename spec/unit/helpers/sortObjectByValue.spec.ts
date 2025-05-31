import sortObjectByValue from '../../../src/helpers/sortObjectByValue.js'
import GraphNode from '../../../test-app/app/models/Graph/Node.js'

describe('sortObjectByValue', () => {
  it('returns a copy of the object with values in alphabetical order', () => {
    const obj = { c: 'hello', a: 'world', b: 'goodbye' }
    const sortedObj = sortObjectByValue(obj)

    expect(sortedObj).toEqual({
      b: 'goodbye',
      c: 'hello',
      a: 'world',
    })

    expect(Object.values(obj)).not.toEqual(['goodbye', 'hello', 'world'])
    expect(Object.keys(obj)).not.toEqual(['b', 'c', 'a'])

    expect(Object.values(sortedObj)).toEqual(['goodbye', 'hello', 'world'])
    expect(Object.keys(sortedObj)).toEqual(['b', 'c', 'a'])
  })

  it('can sort by a custom comparator function', async () => {
    const hello = await GraphNode.create({ name: 'Hello' })
    const world = await GraphNode.create({ name: 'World' })
    const goodbye = await GraphNode.create({ name: 'Goodbye' })

    const obj = { c: hello, a: world, b: goodbye }
    const sortedObj = sortObjectByValue(obj, graphNode => graphNode.name!)

    expect(sortedObj).toEqual({
      b: goodbye,
      c: hello,
      a: world,
    })

    expect(Object.values(obj)).not.toEqual([goodbye, hello, world])
    expect(Object.keys(obj)).not.toEqual(['b', 'c', 'a'])

    expect(Object.values(sortedObj)).toEqual([goodbye, hello, world])
    expect(Object.keys(sortedObj)).toEqual(['b', 'c', 'a'])
  })
})
