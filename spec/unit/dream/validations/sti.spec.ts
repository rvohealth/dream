import Mylar from '../../../../test-app/app/models/Balloon/Mylar.js'

describe('Dream validations with STI models', () => {
  it('applies validations from base model', () => {
    const validation = Mylar['validations'].find(v => v.column === 'volume' && v.type === 'numericality')!
    expect(validation.type).toEqual('numericality')
    expect(validation.column).toEqual('volume')
  })
})
