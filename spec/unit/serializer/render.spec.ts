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
      let subject = () => new MySerializer({ created_at: createdAt }).render()
      let createdAt: DateTime | null | undefined

      beforeEach(() => {
        createdAt = null
      })
      class MySerializer extends DreamSerializer {
        @Attribute('date')
        public created_at: string
      }

      context('the date field is a valid luxon date', () => {
        beforeEach(() => {
          createdAt = DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd')
        })

        it('renders unique format for dates', async () => {
          expect(subject()).toEqual({ createdAt: '2002-10-02' })
        })
      })

      context('the date field is null', () => {
        it('sets the field to null on the serializer', () => {
          expect(subject()).toEqual({ createdAt: null })
        })
      })

      context('the date field is undefined', () => {
        beforeEach(() => {
          createdAt = undefined
        })

        it('sets the field to null on the serializer', () => {
          const serializer = new MySerializer({
            created_at: undefined,
          })
          expect(serializer.render()).toEqual({ createdAt: null })
        })
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

      context('when the source option is passed', () => {
        class UserSerializerWithSource extends DreamSerializer {
          @RendersMany(() => PetSerializer, { source: 'pets' })
          public hooligans: Pet[]
        }

        it('correctly serializes based on source', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          await Pet.create({ user, name: 'aster', species: 'cat' })
          await user.load('pets')

          const serializer = new UserSerializerWithSource(user)
          expect(serializer.render()).toEqual({ hooligans: [{ name: 'aster', species: 'cat' }] })
        })
      })

      context('when the through option is passed', () => {
        class PersonSerializer extends DreamSerializer {
          @RendersMany(() => ChalupaSerializer, { through: 'chalupatown' })
          public chalupas: any[]
        }

        class ChalupaSerializer extends DreamSerializer {
          @Attribute()
          public deliciousness: number
        }

        it('correctly serializes based on source', () => {
          const serializer = new PersonSerializer({
            chalupatown: { chalupas: [{ deliciousness: 5000 }, { deliciousness: 7000 }] },
          })
          expect(serializer.render()).toEqual({
            chalupas: [{ deliciousness: 5000 }, { deliciousness: 7000 }],
          })
        })

        context('with nested fields to traverse', () => {
          class PersonSerializer2 extends DreamSerializer {
            @RendersMany(() => ChalupaSerializer, { through: 'chalupatowns.greatest.hits' })
            public chalupas: any[]
          }

          it('correctly traverses nested objects to reach through target', () => {
            const serializer = new PersonSerializer2({
              chalupatowns: {
                greatest: {
                  hits: {
                    chalupas: [{ deliciousness: 5000 }, { deliciousness: 7000 }],
                  },
                },
              },
            })
            expect(serializer.render()).toEqual({
              chalupas: [{ deliciousness: 5000 }, { deliciousness: 7000 }],
            })
          })
        })
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

      context('when the source option is passed', () => {
        class PetSerializer extends DreamSerializer {
          @RendersOne(() => UserSerializer, { source: 'user' })
          public owner: User
        }

        it('correctly serializes based on source', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat' })

          const serializer = new PetSerializer(pet)
          expect(serializer.render()).toEqual({ owner: { email: 'how@yadoin' } })
        })
      })

      context('when the through option is passed', () => {
        class PersonSerializer extends DreamSerializer {
          @RendersOne(() => HappinessSerializer, { through: 'cat' })
          public happiness: any
        }

        class HappinessSerializer extends DreamSerializer {
          @Attribute()
          public level: number
        }

        it('correctly serializes based on source', () => {
          const serializer = new PersonSerializer({
            cat: {
              happiness: {
                id: 1,
                level: 5000,
              },
            },
          })
          expect(serializer.render()).toEqual({ happiness: { level: 5000 } })
        })

        context('with nested fields to traverse', () => {
          class PersonSerializer2 extends DreamSerializer {
            @RendersOne(() => HappinessSerializer2, { through: 'double.nested.cat' })
            public happiness: any
          }

          class HappinessSerializer2 extends DreamSerializer {
            @Attribute()
            public level: number
          }

          it('correctly traverses nested objects to reach through target', () => {
            const serializer = new PersonSerializer2({
              double: {
                nested: {
                  cat: {
                    happiness: {
                      id: 1,
                      level: 5000,
                    },
                  },
                },
              },
            })
            expect(serializer.render()).toEqual({ happiness: { level: 5000 } })
          })
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

  context('with passthrough data applied', () => {
    class ParentSerializer extends DreamSerializer {
      @RendersOne(() => IntermediateSerilizer)
      public child: any
    }

    class IntermediateSerilizer extends DreamSerializer {
      @RendersOne(() => ChildSerializer)
      public child: any

      @Attribute()
      public howyadoin() {
        return this.passthroughData.howyadoin
      }
    }

    class ChildSerializer extends DreamSerializer {
      @Attribute()
      public howyadoin() {
        return this.passthroughData.howyadoin
      }
    }

    it('correctly sends passthrough data to child serializers', () => {
      const serializer = new ParentSerializer({ child: { child: {} } }).passthrough({
        howyadoin: 'howyadoin',
      })
      expect(serializer.render()).toEqual({
        child: { howyadoin: 'howyadoin', child: { howyadoin: 'howyadoin' } },
      })
    })
  })
})
