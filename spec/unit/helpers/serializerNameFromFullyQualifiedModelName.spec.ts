import serializerNameFromFullyQualifiedModelName from '../../../src/serializer/helpers/serializerNameFromFullyQualifiedModelName.js'

describe('serializerNameFromFullyQualifiedModelName', () => {
  context('default', () => {
    it('appends Serializer to the global model name', () => {
      expect(serializerNameFromFullyQualifiedModelName('Graph/Node')).toEqual('GraphNodeSerializer')
    })
  })

  context('summary', () => {
    it('appends Serializer to the global model name', () => {
      expect(serializerNameFromFullyQualifiedModelName('Graph/Node', 'summary')).toEqual(
        'GraphNodeSummarySerializer'
      )
    })
  })
})
