import { Query } from '../../../src/index.js'
import Collar from '../../../test-app/app/models/Collar.js'

describe('Dream.leftJoinPreloadFor(serializerKey)', () => {
  it('calls to Query#leftJoinPreloadFor, passing options', () => {
    const spy = vi.spyOn(Query.prototype, 'leftJoinPreloadFor').mockReturnValue('abc' as any)
    const fn: any = () => {}
    const query = Collar.leftJoinPreloadFor('default', fn)
    expect(spy).toHaveBeenCalledWith('default', fn)
    expect(query).toEqual('abc')
  })
})
