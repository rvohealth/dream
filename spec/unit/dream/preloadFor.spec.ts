import { Query } from '../../../src/index.js'
import Collar from '../../../test-app/app/models/Collar.js'

describe('Dream.preloadFor(serializerKey)', () => {
  it('calls to Query#preloadFor, passing options', () => {
    const spy = vi.spyOn(Query.prototype, 'preloadFor').mockReturnValue('abc' as any)
    const fn: any = () => {}
    const query = Collar.preloadFor('default', fn)
    expect(spy).toHaveBeenCalledWith('default', fn)
    expect(query).toEqual('abc')
  })
})
