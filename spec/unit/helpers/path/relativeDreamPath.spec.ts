import relativeDreamPath, { dreamPathTypeRelativePath } from '../../../../src/helpers/path/relativeDreamPath'

describe('relativeDreamPath', () => {
  context('to models', () => {
    context('from serializers with a model name', () => {
      it('returns ../models/<ModelName>', () => {
        expect(relativeDreamPath('serializers', 'models', 'User')).toEqual('../models/User')
      })
    })

    context('from factories with a model name', () => {
      it('returns ../../app/models/<ModelName>', () => {
        expect(relativeDreamPath('factories', 'models', 'User')).toEqual('../../app/models/User')
      })
    })

    context('from serializers with a nested model name', () => {
      it('returns ../models/<NestedName>/<ModelName>', () => {
        expect(relativeDreamPath('serializers', 'models', 'Graph/Edge')).toEqual('../../models/Graph/Edge')
      })
    })

    context('from factories with a nested model name', () => {
      it('returns ../../app/models/<NestedName>/<ModelName>', () => {
        expect(relativeDreamPath('factories', 'models', 'Graph/Edge')).toEqual(
          '../../../app/models/Graph/Edge'
        )
      })
    })

    context('to models with a different origin and destination model', () => {
      context('from serializers with a model name', () => {
        it('returns ../models/<DestinationModelName>', () => {
          expect(relativeDreamPath('serializers', 'models', 'User', 'Graph/Edge')).toEqual(
            '../models/Graph/Edge'
          )
        })
      })

      context('from factories with a model name', () => {
        it('returns ../../app/models/<ModelName>', () => {
          expect(relativeDreamPath('factories', 'models', 'User', 'Graph/Edge')).toEqual(
            '../../app/models/Graph/Edge'
          )
        })
      })

      context('from serializers with a nested model name', () => {
        it('returns ../models/<NestedName>/<ModelName>', () => {
          expect(relativeDreamPath('serializers', 'models', 'Graph/Edge', 'User')).toEqual(
            '../../models/User'
          )
        })
      })

      context('from factories with a nested model name', () => {
        it('returns ../../app/models/<NestedName>/<ModelName>', () => {
          expect(relativeDreamPath('factories', 'models', 'Graph/Edge', 'User')).toEqual(
            '../../../app/models/User'
          )
        })
      })

      context('from models with a model name', () => {
        it('returns ./<NestedName>/<ModelName>', () => {
          expect(relativeDreamPath('models', 'models', 'User', 'Graph/Edge')).toEqual('./Graph/Edge')
        })
      })

      context('from models with a nested model name', () => {
        it('returns ../<ModelName>', () => {
          expect(relativeDreamPath('models', 'models', 'Graph/Edge', 'User')).toEqual('../User')
        })
      })
    })

    context('from model with a nested model name to a model in the same directory', () => {
      it('returns ./<ModelName>', () => {
        expect(relativeDreamPath('models', 'models', 'Graph/Edge', 'Graph/Base')).toEqual('./Base')
        expect(relativeDreamPath('models', 'models', 'Graph/Edge/Hello', 'Graph/Base')).toEqual('../Base')
        expect(relativeDreamPath('models', 'models', 'Graph/Edge', 'Graph/Hello/World')).toEqual(
          './Hello/World'
        )
      })
    })
  })

  context('to serializers', () => {
    context('from models with a model name', () => {
      it('returns ../serializers/<ModelName>Serializer', () => {
        expect(relativeDreamPath('models', 'serializers', 'User')).toEqual('../serializers/UserSerializer')
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../serializers/<NestedName>/<ModelName>Serializer', () => {
        expect(relativeDreamPath('models', 'serializers', 'Graph/Edge')).toEqual(
          '../../serializers/Graph/EdgeSerializer'
        )
      })
    })

    context('from serializer with a nested model name to a serializer in the same directory', () => {
      it('returns ./<ModelName>Serializer', () => {
        expect(relativeDreamPath('serializers', 'serializers', 'Graph/Edge', 'Graph/Base')).toEqual(
          './BaseSerializer'
        )
        expect(relativeDreamPath('serializers', 'serializers', 'Graph/Edge/Hello', 'Graph/Base')).toEqual(
          '../BaseSerializer'
        )
        expect(relativeDreamPath('serializers', 'serializers', 'Graph/Edge', 'Graph/Hello/World')).toEqual(
          './Hello/WorldSerializer'
        )
      })
    })
  })

  context('to db', () => {
    context('from models with a model name', () => {
      it('returns ../serializers/<ModelName>Serializer', () => {
        expect(relativeDreamPath('models', 'db', 'User')).toEqual('../../db/')
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../serializers/<NestedName>/<ModelName>Serializer', () => {
        expect(relativeDreamPath('models', 'db', 'Graph/Edge')).toEqual('../../../db/')
      })
    })
  })

  context.only('to factories', () => {
    context('from models with a model name', () => {
      it('returns ../../spec/factories/<ModelName>Factory', () => {
        expect(relativeDreamPath('models', 'factories', 'User')).toEqual('../../spec/factories/UserFactory')
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../factories/<NestedName>/<ModelName>Factory', () => {
        expect(relativeDreamPath('models', 'factories', 'Graph/Edge')).toEqual(
          '../../../spec/factories/Graph/EdgeFactory'
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
