import sortObjectByKey from '../../../src/helpers/sortObjectByKey.js'

describe('sortObjectByKey', () => {
  it('returns a copy of the object with keys in alphabetical order', () => {
    const obj = { c: 'goodbye', a: 'world', b: 'hello' }
    const sortedObj = sortObjectByKey(obj)

    expect(sortedObj).toEqual({
      a: 'world',
      b: 'hello',
      c: 'goodbye',
    })

    expect(Object.keys(obj)).not.toEqual(['a', 'b', 'c'])
    expect(Object.values(obj)).not.toEqual(['world', 'hello', 'goodbye'])

    expect(Object.keys(sortedObj)).toEqual(['a', 'b', 'c'])
    expect(Object.values(sortedObj)).toEqual(['world', 'hello', 'goodbye'])
  })
})
