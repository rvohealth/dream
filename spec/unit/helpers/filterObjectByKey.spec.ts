import filterObjectByKey from '../../../src/helpers/filterObjectByKey'

describe('filterObjectByKey', () => {
  it('filters objects by key', () => {
    const result = filterObjectByKey({ a: 'hello', b: 'world', c: 'goodbye' }, ['b'])
    expect(result).toEqual({ b: 'world' })
  })

  it('includes object keys in the order they are in the array', () => {
    const result = filterObjectByKey({ a: 'hello', b: 'world', c: 'goodbye' }, ['c', 'b', 'a'])
    expect(result).toEqual({ c: 'goodbye', b: 'world', a: 'hello' })
  })
})
