import { DateTime } from 'luxon'
import DreamSerializer from '../../../src/serializer'
import Attribute from '../../../src/serializer/decorators/attribute'
import RendersMany from '../../../src/serializer/decorators/associations/renders-many'
import RendersOne from '../../../src/serializer/decorators/associations/renders-one'
import User from '../../../test-app/app/models/User'
import Pet from '../../../test-app/app/models/Pet'
import Delegate from '../../../src/serializer/decorators/delegate'

describe('DreamSerializer#render', () => {
  it('renders a single attribute', async () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }
    const serializer = new MySerializer({ email: 'abc', password: '123' })
    expect(serializer.render()).toEqual({ email: 'abc' })
  })

  it('renders multiple attributes', async () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string

      @Attribute()
      public name: string
    }
    const serializer = new MySerializer({ email: 'abc', name: 'james' })
    expect(serializer.render()).toEqual({ email: 'abc', name: 'james' })
  })

  it('excludes hidden attributes', async () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string

      @Attribute()
      public name: string
    }
    const serializer = new MySerializer({ email: 'abc', password: 'james' })
    expect(serializer.render()).toEqual({ email: 'abc' })
  })

  context('with decorated attributes', () => {
    context('one of the fields is a date', () => {
      it('renders unique format for dates', async () => {
        class MySerializer extends DreamSerializer {
          @Attribute('date')
          public created_at: string
        }
        const serializer = new MySerializer({ created_at: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
        expect(serializer.render()).toEqual({ createdAt: '2002-10-02' })
      })
    })
  })

  context('with casing specified', () => {
    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', async () => {
        class MySerializer extends DreamSerializer {
          @Attribute('date')
          public createdAt: string
        }
        const serializer = new MySerializer({ createdAt: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
        expect(serializer.casing('snake').render()).toEqual({ created_at: '2002-10-02' })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', async () => {
        class MySerializer extends DreamSerializer {
          @Attribute('date')
          public created_at: string
        }
        const serializer = new MySerializer({ created_at: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
        expect(serializer.casing('camel').render()).toEqual({ createdAt: '2002-10-02' })
      })
    })
  })

  context('when passed a dream instance', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }

    it('serializes the attributes of the dream', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const serializer = new MySerializer(user)
      expect(serializer.render()).toEqual({ email: 'how@yadoin' })
    })

    context('given an array of dream instances', () => {
      it('renders all passed dreams to the shape specified by the serializer', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const serializer = new MySerializer([user])
        expect(serializer.render()).toEqual([{ email: 'how@yadoin' }])
      })
    })
  })

  context('when defined with a functional attribute', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email(attributes: any) {
        return attributes.email.replace(/@/, '#')
      }
    }

    it('serializes the attributes of the dream', async () => {
      const serializer = new MySerializer({ email: 'fish@fish' })
      expect(serializer.render()).toEqual({ email: 'fish#fish' })
    })
  })

  context('when defined with an association', () => {
    context('RendersMany', () => {
      class UserSerializer extends DreamSerializer {
        @RendersMany(() => PetSerializer)
        public pets: Pet[]
      }

      class PetSerializer extends DreamSerializer {
        @Attribute()
        public name: string

        @Attribute()
        public species: string
      }

      it('identifies associations and serializes them using respecting serializers', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        await Pet.create({ user, name: 'aster', species: 'cat' })
        await user.load('pets')

        const serializer = new UserSerializer(user)
        expect(serializer.render()).toEqual({ pets: [{ name: 'aster', species: 'cat' }] })
      })

      context('when the field is undefined', () => {
        it('adds a blank array', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          await Pet.create({ user, name: 'aster', species: 'cat' })

          const serializer = new UserSerializer(user)
          expect(serializer.render()).toEqual({ pets: [] })
        })
      })
    })

    context('RendersOne', () => {
      class UserSerializer extends DreamSerializer {
        @Attribute()
        public email: string
      }

      class PetSerializer extends DreamSerializer {
        @RendersOne(() => UserSerializer)
        public user: User
      }

      it('identifies associations and serializes them using respecting serializers', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const pet = await Pet.create({ user, name: 'aster', species: 'cat' })
        await pet.load('user')

        const serializer = new PetSerializer(pet)
        expect(serializer.render()).toEqual({ user: { email: 'how@yadoin' } })
      })

      context('when the field is undefined', () => {
        it('sets to null', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat' })

          // @ts-ignore: this is intentional to simulate a miscasted var
          pet.user = undefined

          const serializer = new PetSerializer(pet)
          expect(serializer.render()).toEqual({ user: null })
        })
      })

      context('with flatten set on RendersOne', () => {
        class PetSerializerFlattened extends DreamSerializer {
          @RendersOne(() => UserSerializer, { flatten: true })
          public user: User
        }

        it('flattens association attributes into parent serializer', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          await pet.load('user')

          const serializer = new PetSerializerFlattened(pet)
          expect(serializer.render()).toEqual({ email: 'how@yadoin' })
        })
      })
    })

    context('with attribute delegations', () => {
      it('returns the delegated attributes in the payload', async () => {
        class PetSerializer extends DreamSerializer {
          @Delegate('user')
          public email: string
        }

        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const pet = await Pet.create({ user, name: 'aster', species: 'cat' })
        await pet.load('user')

        const serializer = new PetSerializer(pet)
        expect(serializer.render()).toEqual({ email: 'how@yadoin' })
      })

      context('with casing', () => {
        it('returns the delegated attributes in the correct casing in the payload', async () => {
          class PetSerializer extends DreamSerializer {
            @Delegate('user')
            public updated_at: string
          }

          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          await pet.load('user')

          const serializer = new PetSerializer(pet)
          expect(serializer.casing('camel').render()).toEqual({ updatedAt: user.updated_at })
        })
      })
    })
  })
})
