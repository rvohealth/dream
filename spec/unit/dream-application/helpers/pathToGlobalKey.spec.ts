import pathToGlobalKey from '../../../../src/dream-application/helpers/pathToGlobalKey'

describe('pathToGlobalKey', () => {
  it('converts test-app/app/models/Graph/Edge.ts to models/Graph/Edge', () => {
    expect(pathToGlobalKey('test-app/app/models/Graph/Edge.ts', 'test-app/app/models/')).toEqual(
      'models/Graph/Edge'
    )
  })
})
