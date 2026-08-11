import NoSerializersResolvedForKey from '../../../../src/errors/serializers/NoSerializersResolvedForKey.js'
import {
  inferSerializersFromDreamClassOrViewModelClass,
  inferSerializersFromDreamClassOrViewModelClassOrFail,
} from '../../../../src/serializer/helpers/inferSerializerFromDreamOrViewModel.js'
import Balloon from '../../../../test-app/app/models/Balloon.js'

describe('inferSerializersFromDreamClassOrViewModelClassOrFail', () => {
  it('returns what inferSerializersFromDreamClassOrViewModelClass returns when it resolves anything', () => {
    expect(inferSerializersFromDreamClassOrViewModelClassOrFail(Balloon, 'stiUnion')).toEqual(
      inferSerializersFromDreamClassOrViewModelClass(Balloon, 'stiUnion')
    )
  })

  context('when resolution yields no serializers at all', () => {
    // The guard the serializer walks rely on: an empty serializer set would otherwise become a
    // silently empty preload set, and the symptom would be a NonLoadedAssociation at render naming
    // an innocent class rather than an error naming the real problem. A null class is the only way
    // to reach it today — every other route to an empty set throws while resolving — which is
    // exactly why it is guarded rather than assumed.
    it('throws NoSerializersResolvedForKey rather than returning an empty set', () => {
      expect(inferSerializersFromDreamClassOrViewModelClass(null, 'stiUnion')).toEqual([])
      expect(() => inferSerializersFromDreamClassOrViewModelClassOrFail(null, 'stiUnion')).toThrow(
        NoSerializersResolvedForKey
      )
    })

    it('names the serializer key in the error message', () => {
      expect(() => inferSerializersFromDreamClassOrViewModelClassOrFail(null, 'stiUnion')).toThrow(
        /serializer key `stiUnion`/
      )
    })
  })
})
