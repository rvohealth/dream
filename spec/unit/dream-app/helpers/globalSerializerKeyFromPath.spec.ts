import globalSerializerKeyFromPath from '../../../../src/dream-app/helpers/globalSerializerKeyFromPath.js'

describe('globalSerializerKeyFromPath', () => {
  it('converts test-app/app/serializers/Graph/EdgeSerializer.ts to GraphEdgeSerializer', () => {
    expect(
      globalSerializerKeyFromPath(
        'test-app/app/serializers/Graph/EdgeSerializer.js',
        'test-app/app/serializers/'
      )
    ).toEqual('Graph/EdgeSerializer')
  })

  context('with a named export', () => {
    it('replaces the final path part with the named export', () => {
      expect(
        globalSerializerKeyFromPath(
          'test-app/app/serializers/Graph/EdgeSerializer.js',
          'test-app/app/serializers/',
          'SummaryEdgeSerializer'
        )
      ).toEqual('Graph/SummaryEdgeSerializer')
    })
  })

  context('when the named export starts with the nested path', () => {
    it('does not duplicate the nested path', () => {
      expect(
        globalSerializerKeyFromPath(
          'test-app/app/serializers/LocalizedText/BaseSerializer.js',
          'test-app/app/serializers/',
          'LocalizedTextBaseSerializer'
        )
      ).toEqual('LocalizedText/BaseSerializer')
    })
  })
})
