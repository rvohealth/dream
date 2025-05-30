import serializerOpenapiNameFromPath from '../../../../src/dream-app/helpers/serializerOpenapiNameFromPath.js'

describe('serializerOpenapiNameFromPath', () => {
  it('converts test-app/app/serializers/PetSerializer.ts to Pet', () => {
    expect(
      serializerOpenapiNameFromPath('test-app/app/serializers/PetSerializer.js', 'test-app/app/serializers/')
    ).toEqual('Pet')
  })

  context('with a named export', () => {
    it('is the named export (with trailing "Serializer" removed)', () => {
      expect(
        serializerOpenapiNameFromPath(
          'test-app/app/serializers/PetSerializer.js',
          'test-app/app/serializers/',
          'PetSummarySerializer'
        )
      ).toEqual('PetSummary')
    })
  })

  it('converts test-app/app/serializers/Graph/EdgeSerializer.ts to GraphEdgeSerializer', () => {
    expect(
      serializerOpenapiNameFromPath(
        'test-app/app/serializers/Graph/EdgeSerializer.js',
        'test-app/app/serializers/'
      )
    ).toEqual('GraphEdge')
  })

  context('a named export in a nested directory', () => {
    it('is the named export (with trailing "Serializer" removed)', () => {
      expect(
        serializerOpenapiNameFromPath(
          'test-app/app/serializers/Graph/EdgeSerializer.js',
          'test-app/app/serializers/',
          'SummaryEdgeSerializer'
        )
      ).toEqual('SummaryEdge')
    })
  })
})
