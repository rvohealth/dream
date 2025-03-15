import { capitalize } from '../../../src.js'

describe('capitalize', () => {
  it('capitalizes strings', () => {
    expect(capitalize('hello')).toEqual('Hello')
  })

  it('capitalizes capitalizable utf-8 characters', () => {
    expect(capitalize('über')).toEqual('Über')
  })

  it('doesn’t break with un-capitalizable utf-8 characters', () => {
    expect(capitalize('😊hello')).toEqual('😊hello')
  })
})
