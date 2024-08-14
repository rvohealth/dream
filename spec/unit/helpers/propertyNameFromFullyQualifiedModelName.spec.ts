import propertyNameFromFullyQualifiedModelName from '../../../src/helpers/propertyNameFromFullyQualifiedModelName'

describe('propertyNameFromFullyQualifiedModelName', () => {
  it('changes user to User', () => {
    expect(propertyNameFromFullyQualifiedModelName('user')).toEqual('user')
  })

  it('changes graph/edge to Graph/Edge', () => {
    expect(propertyNameFromFullyQualifiedModelName('graph/edge')).toEqual('graphEdge')
  })

  it('leaves User as is', () => {
    expect(propertyNameFromFullyQualifiedModelName('User')).toEqual('user')
  })

  it('leaves Graph/Edge as is', () => {
    expect(propertyNameFromFullyQualifiedModelName('Graph/Edge')).toEqual('graphEdge')
  })
})
