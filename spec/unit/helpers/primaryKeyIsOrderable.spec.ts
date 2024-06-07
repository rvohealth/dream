import primaryKeyIsOrderable from '../../../src/helpers/primaryKeyIsOrderable'

describe('primaryKeyIsOrderable', () => {
  it('returns true for sequential primary key types types', () => {
    expect(primaryKeyIsOrderable('integer')).toEqual(true)
    expect(primaryKeyIsOrderable('bigint')).toEqual(true)
    expect(primaryKeyIsOrderable('bigserial')).toEqual(true)
  })

  it('returns false for non-sequential primary key types', () => {
    expect(primaryKeyIsOrderable('uuid')).toEqual(false)
  })
})
