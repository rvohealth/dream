import absoluteDreamPath from '../../../../src/helpers/path/absoluteDreamPath.js'

describe('absoluteDreamPath', () => {
  context('models', () => {
    it('returns @models/<ModelName>.js', () => {
      expect(absoluteDreamPath('models', 'User')).toEqual('@models/User.js')
    })

    context('nested', () => {
      it('returns @models/<NestedName>/<ModelName>.js', () => {
        expect(absoluteDreamPath('models', 'Graph/Edge')).toEqual('@models/Graph/Edge.js')
      })
    })
  })

  context('to serializers', () => {
    it('returns @serializers/<ModelName>Serializer.js', () => {
      expect(absoluteDreamPath('serializers', 'User')).toEqual('@serializers/UserSerializer.js')
    })

    context('nested', () => {
      it('returns @serializers/<NestedName>/<ModelName>Serializer.js', () => {
        expect(absoluteDreamPath('serializers', 'Graph/Edge')).toEqual('@serializers/Graph/EdgeSerializer.js')
      })
    })
  })

  context('factories', () => {
    it('returns @spec/factories/<ModelName>Factory.js', () => {
      expect(absoluteDreamPath('factories', 'User')).toEqual('@spec/factories/UserFactory.js')
    })

    context('nexted', () => {
      it('returns ../factories/<NestedName>/<ModelName>Factory.js', () => {
        expect(absoluteDreamPath('factories', 'Graph/Edge')).toEqual('@spec/factories/Graph/EdgeFactory.js')
      })
    })
  })
})
