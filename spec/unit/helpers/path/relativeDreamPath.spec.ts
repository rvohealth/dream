import relativeDreamPath, {
  dreamPathTypeRelativePath,
} from '../../../../src/helpers/path/relativeDreamPath.js'

describe('relativeDreamPath', () => {
  context('to models', () => {
    context('from serializers with a model name', () => {
      it('returns ../models/<ModelName>.js', () => {
        expect(relativeDreamPath('serializers', 'models', 'User')).toEqual('../models/User.js')
      })
    })

    context('from factories with a model name', () => {
      it('returns ../../app/models/<ModelName>.js', () => {
        expect(relativeDreamPath('factories', 'models', 'User')).toEqual('../../app/models/User.js')
      })
    })

    context('from serializers with a nested model name', () => {
      it('returns ../models/<NestedName>/<ModelName>.js', () => {
        expect(relativeDreamPath('serializers', 'models', 'Graph/Edge')).toEqual('../../models/Graph/Edge.js')
      })
    })

    context('from factories with a nested model name', () => {
      it('returns ../../app/models/<NestedName>/<ModelName>.js', () => {
        expect(relativeDreamPath('factories', 'models', 'Graph/Edge')).toEqual(
          '../../../app/models/Graph/Edge.js'
        )
      })
    })

    context('to models with a different origin and destination model', () => {
      context('from serializers with a model name', () => {
        it('returns ../models/<DestinationModelName>.js', () => {
          expect(relativeDreamPath('serializers', 'models', 'User', 'Graph/Edge')).toEqual(
            '../models/Graph/Edge.js'
          )
        })
      })

      context('from factories with a model name', () => {
        it('returns ../../app/models/<ModelName>.js', () => {
          expect(relativeDreamPath('factories', 'models', 'User', 'Graph/Edge')).toEqual(
            '../../app/models/Graph/Edge.js'
          )
        })
      })

      context('from serializers with a nested model name', () => {
        it('returns ../models/<NestedName>/<ModelName>.js', () => {
          expect(relativeDreamPath('serializers', 'models', 'Graph/Edge', 'User')).toEqual(
            '../../models/User.js'
          )
        })
      })

      context('from factories with a nested model name', () => {
        it('returns ../../app/models/<NestedName>/<ModelName>.js', () => {
          expect(relativeDreamPath('factories', 'models', 'Graph/Edge', 'User')).toEqual(
            '../../../app/models/User.js'
          )
        })
      })

      context('from models with a model name', () => {
        it('returns ./<NestedName>/<ModelName>.js', () => {
          expect(relativeDreamPath('models', 'models', 'User', 'Graph/Edge')).toEqual('./Graph/Edge.js')
        })
      })

      context('from models with a nested model name', () => {
        it('returns ../<ModelName>.js', () => {
          expect(relativeDreamPath('models', 'models', 'Graph/Edge', 'User')).toEqual('../User.js')
        })
      })
    })

    context('from model with a nested model name to a model in the same directory', () => {
      it('returns ./<ModelName>.js', () => {
        expect(relativeDreamPath('models', 'models', 'Graph/Edge', 'Graph/Base')).toEqual('./Base.js')
        expect(relativeDreamPath('models', 'models', 'Graph/Edge/Hello', 'Graph/Base')).toEqual('../Base.js')
        expect(relativeDreamPath('models', 'models', 'Graph/Edge', 'Graph/Hello/World')).toEqual(
          './Hello/World.js'
        )
      })
    })
  })

  context('to serializers', () => {
    context('from models with a model name', () => {
      it('returns ../serializers/<ModelName>Serializer.js', () => {
        expect(relativeDreamPath('models', 'serializers', 'User')).toEqual('../serializers/UserSerializer.js')
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../serializers/<NestedName>/<ModelName>Serializer.js', () => {
        expect(relativeDreamPath('models', 'serializers', 'Graph/Edge')).toEqual(
          '../../serializers/Graph/EdgeSerializer.js'
        )
      })
    })

    context('from serializer with a nested model name to a serializer in the same directory', () => {
      it('returns ./<ModelName>Serializer.js', () => {
        expect(relativeDreamPath('serializers', 'serializers', 'Graph/Edge', 'Graph/Base')).toEqual(
          './BaseSerializer.js'
        )
        expect(relativeDreamPath('serializers', 'serializers', 'Graph/Edge/Hello', 'Graph/Base')).toEqual(
          '../BaseSerializer.js'
        )
        expect(relativeDreamPath('serializers', 'serializers', 'Graph/Edge', 'Graph/Hello/World')).toEqual(
          './Hello/WorldSerializer.js'
        )
      })
    })
  })

  context('to db', () => {
    context('from models with a model name', () => {
      it('returns ../serializers/<ModelName>Serializer.js', () => {
        expect(relativeDreamPath('models', 'db', 'User')).toEqual('../../db/')
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../serializers/<NestedName>/<ModelName>Serializer.js', () => {
        expect(relativeDreamPath('models', 'db', 'Graph/Edge')).toEqual('../../../db/')
      })
    })
  })

  context('to factories', () => {
    context('from models with a model name', () => {
      it('returns ../../spec/factories/<ModelName>Factory.js', () => {
        expect(relativeDreamPath('models', 'factories', 'User')).toEqual(
          '../../spec/factories/UserFactory.js'
        )
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../factories/<NestedName>/<ModelName>Factory.js', () => {
        expect(relativeDreamPath('models', 'factories', 'Graph/Edge')).toEqual(
          '../../../spec/factories/Graph/EdgeFactory.js'
        )
      })
    })
  })
})

describe('dreamPathTypeRelativePath', () => {
  context('from models to models', () => {
    it('returns an empty string', () => {
      expect(dreamPathTypeRelativePath('models', 'models')).toEqual('')
    })
  })

  context('from serializers to models', () => {
    it('returns ../models', () => {
      expect(dreamPathTypeRelativePath('serializers', 'models')).toEqual('../models')
    })
  })

  context('from factories to models', () => {
    it('returns ../../app/models', () => {
      expect(dreamPathTypeRelativePath('factories', 'models')).toEqual('../../app/models')
    })
  })
})
