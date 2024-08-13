import path from 'path'
import relativeDreamPath, { dreamPathTypeRelativePath } from '../../../../src/helpers/path/relativeDreamPath'

describe('relativeDreamPath', () => {
  context('to models', () => {
    context('from serializers with a model name', () => {
      it('returns ../models/<ModelName>', async () => {
        expect(await relativeDreamPath('serializers', 'models', 'User')).toEqual(
          `..${path.sep}models${path.sep}User`
        )
      })
    })

    context('from factories with a model name', () => {
      it('returns ../../app/models/<ModelName>', async () => {
        expect(await relativeDreamPath('factories', 'models', 'User')).toEqual(
          `..${path.sep}..${path.sep}app${path.sep}models${path.sep}User`
        )
      })
    })

    context('from serializers with a nested model name', () => {
      it('returns ../models/<NestedName>/<ModelName>', async () => {
        expect(await relativeDreamPath('serializers', 'models', 'Graph/Edge')).toEqual(
          `..${path.sep}..${path.sep}models${path.sep}Graph${path.sep}Edge`
        )
      })
    })

    context('from factories with a nested model name', () => {
      it('returns ../../app/models/<NestedName>/<ModelName>', async () => {
        expect(await relativeDreamPath('factories', 'models', 'Graph/Edge')).toEqual(
          `..${path.sep}..${path.sep}..${path.sep}app${path.sep}models${path.sep}Graph${path.sep}Edge`
        )
      })
    })

    context('to models with a different origin and destination model', () => {
      context('from serializers with a model name', () => {
        it('returns ../models/<DestinationModelName>', async () => {
          expect(await relativeDreamPath('serializers', 'models', 'User', 'Graph/Edge')).toEqual(
            `..${path.sep}models${path.sep}Graph${path.sep}Edge`
          )
        })
      })

      context('from factories with a model name', () => {
        it('returns ../../app/models/<ModelName>', async () => {
          expect(await relativeDreamPath('factories', 'models', 'User', 'Graph/Edge')).toEqual(
            `..${path.sep}..${path.sep}app${path.sep}models${path.sep}Graph${path.sep}Edge`
          )
        })
      })

      context('from serializers with a nested model name', () => {
        it('returns ../models/<NestedName>/<ModelName>', async () => {
          expect(await relativeDreamPath('serializers', 'models', 'Graph/Edge', 'User')).toEqual(
            `..${path.sep}..${path.sep}models${path.sep}User`
          )
        })
      })

      context('from factories with a nested model name', () => {
        it('returns ../../app/models/<NestedName>/<ModelName>', async () => {
          expect(await relativeDreamPath('factories', 'models', 'Graph/Edge', 'User')).toEqual(
            `..${path.sep}..${path.sep}..${path.sep}app${path.sep}models${path.sep}User`
          )
        })
      })

      context('from models with a model name', () => {
        it('returns ./<NestedName>/<ModelName>', async () => {
          expect(await relativeDreamPath('models', 'models', 'User', 'Graph/Edge')).toEqual(
            `.${path.sep}Graph${path.sep}Edge`
          )
        })
      })

      context('from models with a nested model name', () => {
        it('returns ../<ModelName>', async () => {
          expect(await relativeDreamPath('models', 'models', 'Graph/Edge', 'User')).toEqual(
            `..${path.sep}User`
          )
        })
      })
    })
  })

  context('to serializers', () => {
    context('from models with a model name', () => {
      it('returns ../serializers/<ModelName>Serializer', async () => {
        expect(await relativeDreamPath('models', 'serializers', 'User')).toEqual(
          `..${path.sep}serializers${path.sep}UserSerializer`
        )
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../serializers/<NestedName>/<ModelName>Serializer', async () => {
        expect(await relativeDreamPath('models', 'serializers', 'Graph/Edge')).toEqual(
          `..${path.sep}..${path.sep}serializers${path.sep}Graph${path.sep}EdgeSerializer`
        )
      })
    })
  })

  context('to factories', () => {
    context('from models with a model name', () => {
      it('returns ../../spec/factories/<ModelName>Factory', async () => {
        expect(await relativeDreamPath('models', 'factories', 'User')).toEqual(
          `..${path.sep}..${path.sep}spec${path.sep}factories${path.sep}UserFactory`
        )
      })
    })

    context('from models with a nested model name', () => {
      it('returns ../factories/<NestedName>/<ModelName>Factory', async () => {
        expect(await relativeDreamPath('models', 'factories', 'Graph/Edge')).toEqual(
          `..${path.sep}..${path.sep}..${path.sep}spec${path.sep}factories${path.sep}Graph${path.sep}EdgeFactory`
        )
      })
    })
  })
})

describe('dreamPathTypeRelativePath', () => {
  context('from models to models', () => {
    it('returns an empty string', async () => {
      expect(await dreamPathTypeRelativePath('models', 'models')).toEqual('')
    })
  })

  context('from serializers to models', () => {
    it('returns ../models', async () => {
      expect(await dreamPathTypeRelativePath('serializers', 'models')).toEqual(`..${path.sep}models`)
    })
  })

  context('from factories to models', () => {
    it('returns ../../app/models', async () => {
      expect(await dreamPathTypeRelativePath('factories', 'models')).toEqual(
        `..${path.sep}..${path.sep}app${path.sep}models`
      )
    })
  })
})
