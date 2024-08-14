import pathToGlobalSerializerKey from '../../../../src/dream-application/helpers/pathToGlobalSerializerKey'

describe('pathToGlobalSerializerKey', () => {
  it('converts test-app/app/serializers/Graph/EdgeSerializer.ts to GraphEdgeSerializer', () => {
    expect(
      pathToGlobalSerializerKey(
        'test-app/app/serializers/Graph/EdgeSerializer.ts',
        'test-app/app/serializers/'
      )
    ).toEqual('GraphEdgeSerializer')
  })

  context('with a named export', () => {
    it('replaces the final path part with the named export', () => {
      expect(
        pathToGlobalSerializerKey(
          'test-app/app/serializers/Graph/EdgeSerializer.ts',
          'test-app/app/serializers/',
          'SummaryEdgeSerializer'
        )
      ).toEqual('GraphSummaryEdgeSerializer')
    })
  })
})
