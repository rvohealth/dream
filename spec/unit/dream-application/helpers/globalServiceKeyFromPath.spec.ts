import globalServiceKeyFromPath from '../../../../src/dream-application/helpers/globalServiceKeyFromPath'

describe('globalServiceKeyFromPath', () => {
  it('converts test-app/app/services/Graph/Edge.ts to services/Graph/Edge', () => {
    expect(globalServiceKeyFromPath('test-app/app/servicez/Graph/Edge.ts', 'test-app/app/servicez/')).toEqual(
      'services/Graph/Edge'
    )
  })
})
