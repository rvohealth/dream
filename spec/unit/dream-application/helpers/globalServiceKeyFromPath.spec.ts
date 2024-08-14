import globalServiceKeyFromPath from '../../../../src/dream-application/helpers/globalServiceKeyFromPath'

describe('globalServiceKeyFromPath', () => {
  it('converts test-app/app/services/Graph/Edge.ts to services/Graph/Edge', () => {
    expect(globalServiceKeyFromPath('test-app/app/services/Graph/Edge.ts', 'test-app/app/services/')).toEqual(
      'services/Graph/Edge'
    )
  })
})
