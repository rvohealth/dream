import standardizeFullyQualifiedModelName from '../../../src/helpers/standardizeFullyQualifiedModelName'

describe('standardizeFullyQualifiedModelName', () => {
  it('changes user to User', () => {
    expect(standardizeFullyQualifiedModelName('user')).toEqual('User')
  })

  it('changes graph/edge to Graph/Edge', () => {
    expect(standardizeFullyQualifiedModelName('graph/edge')).toEqual('Graph/Edge')
  })

  it('leaves User as is', () => {
    expect(standardizeFullyQualifiedModelName('User')).toEqual('User')
  })

  it('leaves Graph/Edge as is', () => {
    expect(standardizeFullyQualifiedModelName('Graph/Edge')).toEqual('Graph/Edge')
  })
})
