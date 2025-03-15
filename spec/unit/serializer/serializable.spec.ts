import { isSerializable } from '../../../src/serializer/decorators/associations/shared.js'
import CompositionAsset from '../../../test-app/app/models/CompositionAsset.js'
import BaseExtraRating from '../../../test-app/app/models/ExtraRating/Base.js'
import Pet from '../../../test-app/app/models/Pet.js'

describe('isSerializable', () => {
  it('returns true for Dreams that define serializers', () => {
    expect(isSerializable(Pet)).toBe(true)
  })

  it('returns false for Dreams that define serializers', () => {
    expect(isSerializable(CompositionAsset)).toBe(false)
  })

  it('returns false for Dreams that throw an exception in their serializers getter', () => {
    expect(isSerializable(BaseExtraRating)).toBe(false)
  })
})
