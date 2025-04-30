import globalModelKeyFromPath from '../../../../src/dream-app/helpers/globalModelKeyFromPath.js'

describe('globalModelKeyFromPath', () => {
  it('converts test-app/app/models/Graph/Edge.ts to models/Graph/Edge', () => {
    expect(globalModelKeyFromPath('test-app/app/models/Graph/Edge.js', 'test-app/app/models/')).toEqual(
      'Graph/Edge'
    )
  })
})
