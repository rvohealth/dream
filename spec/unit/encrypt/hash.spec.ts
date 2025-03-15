import { Encrypt } from '../../../src.js'

describe('Encrypt.hash, Encrypt.veryify', () => {
  it('can verify a string', async () => {
    const hash = await Encrypt.hash('helloworld')
    expect(hash).not.toEqual('helloworld')

    expect(await Encrypt.verifyHash('helloworld', hash)).toBe(true)
    expect(await Encrypt.verifyHash('invalid', hash)).toBe(false)
  })
})
