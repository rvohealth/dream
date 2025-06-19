import Collar from '../../../test-app/app/models/Collar.js'

describe('Dream.serializationMap', () => {
  context('when given no serializer key', () => {
    it('renders the default', () => {
      expect(Collar.serializationMap()).toEqual({
        pet: {
          ratings: {},
        },
      })
    })
  })

  context('when given a serializer key', () => {
    it('renders the serializer key', () => {
      expect(Collar.serializationMap('summary')).toEqual({ pet: {} })
    })
  })

  context('deeply-nested associations', () => {
    it('renders the deeply-nested associations', () => {
      expect(Collar.serializationMap('deep')).toEqual({
        pet: {
          ratings: {
            user: {},
          },
        },
      })
    })
  })

  context('infinite nested associations', () => {
    it('limits depth', () => {
      // todo: implement
    })
  })
})
