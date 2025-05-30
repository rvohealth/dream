import serializerGlobalNameFromFullyQualifiedModelName from '../../../src/serializer/helpers/serializerGlobalNameFromFullyQualifiedModelName.js'

describe('serializerGlobalNameFromFullyQualifiedModelName', () => {
  context('default', () => {
    it('appends Serializer to the global model name', () => {
      expect(serializerGlobalNameFromFullyQualifiedModelName('Graph/Node')).toEqual('Graph/NodeSerializer')
    })
  })

  context('summary', () => {
    it('appends Serializer to the global model name', () => {
      expect(serializerGlobalNameFromFullyQualifiedModelName('Graph/Node', 'summary')).toEqual(
        'Graph/NodeSummarySerializer'
      )
    })
  })
})
