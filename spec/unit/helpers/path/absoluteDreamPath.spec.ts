import DreamApp from '../../../../src/dream-app/index.js'
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

  context('importAliasPrefix is set on DreamApp', () => {
    context('importAliasPrefix=#', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importAliasPrefix', 'get').mockReturnValue('#')
      })

      it('returns #models/<ModelName>.js', () => {
        expect(absoluteDreamPath('models', 'User')).toEqual('#models/User.js')
        expect(absoluteDreamPath('models', 'Graph/Edge')).toEqual('#models/Graph/Edge.js')
      })

      it('returns #serializers/<ModelName>Serializer.js', () => {
        expect(absoluteDreamPath('serializers', 'User')).toEqual('#serializers/UserSerializer.js')
        expect(absoluteDreamPath('serializers', 'Graph/Edge')).toEqual('#serializers/Graph/EdgeSerializer.js')
      })

      it('returns #spec/factories/<ModelName>Factory.js', () => {
        expect(absoluteDreamPath('factories', 'User')).toEqual('#spec/factories/UserFactory.js')
        expect(absoluteDreamPath('factories', 'Graph/Edge')).toEqual('#spec/factories/Graph/EdgeFactory.js')
      })

      context('importExtension=none', () => {
        beforeEach(() => {
          vi.spyOn(DreamApp.prototype, 'importExtension', 'get').mockReturnValue('none')
        })

        it('combines the prefix with the suffix style', () => {
          expect(absoluteDreamPath('models', 'User')).toEqual('#models/User')
          expect(absoluteDreamPath('serializers', 'User')).toEqual('#serializers/UserSerializer')
          expect(absoluteDreamPath('factories', 'User')).toEqual('#spec/factories/UserFactory')
        })
      })
    })

    context('importAliasPrefix=@', () => {
      beforeEach(() => {
        vi.spyOn(DreamApp.prototype, 'importAliasPrefix', 'get').mockReturnValue('@')
      })

      it('returns the same paths as the default', () => {
        expect(absoluteDreamPath('models', 'User')).toEqual('@models/User.js')
        expect(absoluteDreamPath('serializers', 'User')).toEqual('@serializers/UserSerializer.js')
        expect(absoluteDreamPath('factories', 'User')).toEqual('@spec/factories/UserFactory.js')
      })
    })
  })
})
