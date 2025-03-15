import globalClassNameFromFullyQualifiedModelName from '../../../src/helpers/globalClassNameFromFullyQualifiedModelName.js'

describe('globalClassNameFromFullyQualifiedModelName', () => {
  it('changes user to User', () => {
    expect(globalClassNameFromFullyQualifiedModelName('user')).toEqual('User')
  })

  it('changes graph/edge to Graph/Edge', () => {
    expect(globalClassNameFromFullyQualifiedModelName('graph/edge')).toEqual('GraphEdge')
  })

  it('leaves User as is', () => {
    expect(globalClassNameFromFullyQualifiedModelName('User')).toEqual('User')
  })

  it('leaves Graph/Edge as is', () => {
    expect(globalClassNameFromFullyQualifiedModelName('Graph/Edge')).toEqual('GraphEdge')
  })
})
