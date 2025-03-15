import globalModelKeyFromPath from '../../../../src/dream-application/helpers/globalModelKeyFromPath.js'

describe('globalModelKeyFromPath', () => {
  it('converts test-app/app/models/Graph/Edge.ts to models/Graph/Edge', () => {
    expect(globalModelKeyFromPath('test-app/app/models/Graph/Edge.ts', 'test-app/app/models/')).toEqual(
      'Graph/Edge'
    )
  })
})
