import shortNameFromFullyQualifiedModelName from '../../../src/helpers/shortNameFromFullyQualifiedModelName'

describe('shortNameFromFullyQualifiedModelName', () => {
  it('changes user to User', () => {
    expect(shortNameFromFullyQualifiedModelName('user')).toEqual('User')
  })

  it('changes graph/edge to Edge', () => {
    expect(shortNameFromFullyQualifiedModelName('graph/edge')).toEqual('Edge')
  })

  it('leaves User as is', () => {
    expect(shortNameFromFullyQualifiedModelName('User')).toEqual('User')
  })

  it('changes Graph/Edge to Edge', () => {
    expect(shortNameFromFullyQualifiedModelName('Graph/Edge')).toEqual('Edge')
  })
})
