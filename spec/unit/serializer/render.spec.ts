import { DreamConst } from '../../../src/dream/constants.js'
import MissingSerializer from '../../../src/errors/MissingSerializersDefinition.js'
import DelegationTargetDoesNotExist from '../../../src/errors/serializers/DelegationTargetDoesNotExist.js'
import { CalendarDate, DateTime, DreamApp, NonLoadedAssociation } from '../../../src/index.js'
import RendersMany from '../../../src/serializer/decorators/associations/RendersMany.js'
import RendersOne from '../../../src/serializer/decorators/associations/RendersOne.js'
import Attribute from '../../../src/serializer/decorators/attribute.js'
import DreamSerializer from '../../../src/serializer/index.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import Pet from '../../../test-app/app/models/Pet.js'
import Post from '../../../test-app/app/models/Post.js'
import Rating from '../../../test-app/app/models/Rating.js'
import User from '../../../test-app/app/models/User.js'
import processDynamicallyDefinedSerializers from '../../helpers/processDynamicallyDefinedSerializers.js'

describe('DreamSerailizer.render', () => {
  it('renders a dream instance', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public name: string
    }
    processDynamicallyDefinedSerializers(MySerializer)

    const results = MySerializer.render({ email: 'abc', name: 'Frodo', password: '123' })

    expect(results).toEqual({ name: 'Frodo' })
  })

  context('passthrough is passed', () => {
    it('sends passthrough through to the serializer instance', () => {
      class MySerializer extends DreamSerializer {
        @Attribute()
        public name() {
          return this.$passthroughData.name
        }
      }
      processDynamicallyDefinedSerializers(MySerializer)

      const results = MySerializer.render(
        { email: 'abc' },
        {
          passthrough: { name: 'calvin coolidge' },
        }
      )

      expect(results).toEqual({ name: 'calvin coolidge' })
    })
  })
})

describe('DreamSerializer#render', () => {
  it('renders a single attribute', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }
    processDynamicallyDefinedSerializers(MySerializer)

    const serializer = new MySerializer({ email: 'abc', password: '123' })
    expect(serializer.render()).toEqual({ email: 'abc' })
  })

  it('renders an attribute from this serializer and the ancestor', () => {
    class BaseSerializer extends DreamSerializer {
      @Attribute()
      public name: string
    }

    class MySerializer extends BaseSerializer {
      @Attribute()
      public email: string
    }
    processDynamicallyDefinedSerializers(MySerializer)

    const serializer = new MySerializer({ email: 'abc', name: 'Frodo', password: '123' })
    expect(serializer.render()).toEqual({ email: 'abc', name: 'Frodo' })
  })

  it('renders a single attribute with no neighboring attributes', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }
    processDynamicallyDefinedSerializers(MySerializer)

    class MyData {
      public get email() {
        return 'abc'
      }
    }

    const serializer = new MySerializer(new MyData())
    expect(serializer.render()).toEqual({ email: 'abc' })
  })

  it('renders multiple attributes', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string

      @Attribute()
      public name: string
    }
    processDynamicallyDefinedSerializers(MySerializer)

    const serializer = new MySerializer({ email: 'abc', name: 'james' })
    expect(serializer.render()).toEqual({ email: 'abc', name: 'james' })
  })

  it('excludes hidden attributes', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string

      @Attribute()
      public name: string
    }
    processDynamicallyDefinedSerializers(MySerializer)

    const serializer = new MySerializer({ email: 'abc', password: 'james' })
    expect(serializer.render()).toEqual({ email: 'abc' })
  })

  it('provides type helping with custom data and passthrough types set', () => {
    class MySerializer extends DreamSerializer<{ email: string }, { howyadoin: string }> {
      @Attribute()
      public email: string

      @Attribute()
      public howyadoin() {
        return this.$passthroughData.howyadoin
      }
    }
    processDynamicallyDefinedSerializers(MySerializer)

    const serializer = new MySerializer({ email: 'abc' }).passthrough({ howyadoin: 'yay' })
    expect(serializer.render()).toEqual({ email: 'abc', howyadoin: 'yay' })
  })

  context('with decorated attributes', () => {
    context('one of the fields is a date', () => {
      const subject = () => new MySerializer({ createdAt }).render()
      let createdAt: CalendarDate | DateTime | string | null | undefined

      beforeEach(() => {
        createdAt = null
      })

      class MySerializer extends DreamSerializer {
        @Attribute('date')
        public createdAt: string
      }
      processDynamicallyDefinedSerializers(MySerializer)

      context('the date field is a valid luxon DateTime', () => {
        beforeEach(() => {
          createdAt = DateTime.fromISO('2002-10-02')
        })

        it('renders unique format for dates', () => {
          expect(subject()).toEqual({ createdAt: '2002-10-02' })
        })
      })

      context('the date field is a valid CalendarDate', () => {
        beforeEach(() => {
          createdAt = CalendarDate.fromISO('2002-10-02')
        })

        it('renders unique format for dates', () => {
          expect(subject()).toEqual({ createdAt: '2002-10-02' })
        })
      })

      context('the date field is a date string', () => {
        beforeEach(() => {
          createdAt = '2002-10-02'
        })

        it('renders the provided string', () => {
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

        it('sets the field to undefined on the serializer', () => {
          const serializer = new MySerializer({
            createdAt: undefined,
          })
          expect(serializer.render()).toEqual({ createdAt: undefined })
        })
      })

      context('the date field is specified using openapi syntax', () => {
        class MySerializer extends DreamSerializer {
          @Attribute({ type: ['string', 'null'], format: 'date' })
          public createdAt: string
        }
        processDynamicallyDefinedSerializers(MySerializer)

        it('correctly serializes the date field', () => {
          const serializer = new MySerializer({
            createdAt: CalendarDate.fromISO('2024-02-02'),
          })
          expect(serializer.render()).toEqual({ createdAt: '2024-02-02' })
        })

        it('correctly serializes the date field', () => {
          const serializer = new MySerializer({
            createdAt: DateTime.fromISO('2023-10-18T13:15:16'),
          })
          expect(serializer.render()).toEqual({ createdAt: '2023-10-18' })
        })
      })
    })

    context('one of the fields is a date array', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('date[]')
        public dates: CalendarDate[]
      }
      processDynamicallyDefinedSerializers(MySerializer)

      it('renders an array of date ISO strings', () => {
        const date1 = CalendarDate.fromISO('2002-10-02')
        const date2 = CalendarDate.fromISO('2002-10-03')
        const rendered = new MySerializer({ dates: [date1, date2] }).render()
        expect(rendered).toEqual({ dates: ['2002-10-02', '2002-10-03'] })
      })
    })

    context('one of the fields is a date-time', () => {
      const subject = () => new MySerializer({ createdAt }).render()
      let createdAt: CalendarDate | DateTime | string | null | undefined

      beforeEach(() => {
        createdAt = null
      })

      class MySerializer extends DreamSerializer {
        @Attribute('date-time')
        public createdAt: string
      }
      processDynamicallyDefinedSerializers(MySerializer)

      context('the date-time field is a valid luxon DateTime', () => {
        beforeEach(() => {
          createdAt = DateTime.fromISO('2002-10-02')
        })

        it('renders unique format for date-times', () => {
          expect(subject()).toEqual({ createdAt: '2002-10-02T00:00:00.000Z' })
        })
      })

      context('the date field is a valid CalendarDate', () => {
        beforeEach(() => {
          createdAt = CalendarDate.fromISO('2002-10-02')
        })

        it('renders unique format for date-times', () => {
          expect(subject()).toEqual({ createdAt: '2002-10-02T00:00:00.000Z' })
        })
      })

      context('the date field is a datetime string', () => {
        beforeEach(() => {
          createdAt = '2002-10-02T00:00:00.000Z'
        })

        it('renders the provided string', () => {
          expect(subject()).toEqual({ createdAt: '2002-10-02T00:00:00.000Z' })
        })
      })

      context('the date-time field is null', () => {
        it('sets the field to null on the serializer', () => {
          expect(subject()).toEqual({ createdAt: null })
        })
      })

      context('the date-time field is undefined', () => {
        beforeEach(() => {
          createdAt = undefined
        })

        it('sets the field to undefined on the serializer', () => {
          const serializer = new MySerializer({
            createdAt: undefined,
          })
          expect(serializer.render()).toEqual({ createdAt: undefined })
        })
      })

      context('the date-time field is specified using openapi syntax', () => {
        class MySerializer extends DreamSerializer {
          @Attribute({ type: ['string', 'null'], format: 'date-time' })
          public createdAt: string
        }
        processDynamicallyDefinedSerializers(MySerializer)

        it('correctly serializes the date field', () => {
          const serializer = new MySerializer({
            createdAt: CalendarDate.fromISO('2024-02-02'),
          })
          expect(serializer.render()).toEqual({ createdAt: '2024-02-02T00:00:00.000Z' })
        })

        it('correctly serializes the date field', () => {
          const serializer = new MySerializer({
            createdAt: DateTime.fromISO('2023-10-18T13:15:16'),
          })
          expect(serializer.render()).toEqual({ createdAt: '2023-10-18T13:15:16.000Z' })
        })
      })
    })

    context('one of the fields is a datetime array', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('date-time[]')
        public datetimes: DateTime[]
      }
      processDynamicallyDefinedSerializers(MySerializer)

      it('renders an array of datetime ISO strings', () => {
        const datetime1 = DateTime.fromISO('2002-10-02T00:00:00.000Z')
        const datetime2 = DateTime.fromISO('2002-10-03T00:00:00.000Z')
        const rendered = new MySerializer({ datetimes: [datetime1, datetime2] }).render()
        expect(rendered).toEqual({ datetimes: ['2002-10-02T00:00:00.000Z', '2002-10-03T00:00:00.000Z'] })
      })
    })

    context('integer', () => {
      let kilos: number | null | undefined

      beforeEach(() => {
        kilos = null
      })

      const subject = () => new MySerializer({ kilos }).render()

      class MySerializer extends DreamSerializer {
        @Attribute('integer')
        public kilos: number
      }
      processDynamicallyDefinedSerializers(MySerializer)

      context('the number field is an integer', () => {
        beforeEach(() => {
          kilos = 7
        })

        it('returns the number as-is', () => {
          expect(subject()).toEqual({ kilos: 7 })
        })
      })

      context('the number field is a decimal', () => {
        beforeEach(() => {
          kilos = 7.6
        })

        it('rounds the decimal to the nearest integer', () => {
          expect(subject()).toEqual({ kilos: 8 })
        })
      })

      context('the integer field is null', () => {
        it('sets the field to null on the serializer', () => {
          expect(subject()).toEqual({ kilos: null })
        })
      })

      context('the integer field is undefined', () => {
        it('sets the field to undefined on the serializer', () => {
          const serializer = new MySerializer({
            kilos: undefined,
          })
          expect(serializer.render()).toEqual({ kilos: undefined })
        })
      })

      context('the field is specified using openapi syntax', () => {
        class MySerializer extends DreamSerializer {
          @Attribute({ type: 'integer' })
          public kilos: number
        }
        processDynamicallyDefinedSerializers(MySerializer)

        it('renders as integer', () => {
          const serializer = new MySerializer({
            kilos: '123.456',
          })
          expect(serializer.render()).toEqual({ kilos: 123 })
        })
      })
    })

    context('integer[]', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('integer[]')
        public kilos: number
      }
      processDynamicallyDefinedSerializers(MySerializer)

      it('rounds the numbers to the nearest integer', () => {
        const kilos = [7.6, 9.1]
        const rendered = new MySerializer({ kilos }).render()
        expect(rendered).toEqual({ kilos: [8, 9] })
      })
    })

    context('decimal', () => {
      let kilos: number | null | undefined

      beforeEach(() => {
        kilos = null
      })

      context('without an explicit precision', () => {
        const subject = () => new MySerializer({ kilos }).render()

        class MySerializer extends DreamSerializer {
          @Attribute('decimal')
          public kilos: number
        }
        processDynamicallyDefinedSerializers(MySerializer)

        context('the number field is a decimal', () => {
          beforeEach(() => {
            kilos = 7.9351
          })

          it('returns the decimal with full precision', () => {
            expect(subject()).toEqual({ kilos: 7.9351 })
          })
        })

        context('the decimal field is null', () => {
          it('sets the field to null on the serializer', () => {
            expect(subject()).toEqual({ kilos: null })
          })
        })

        context('the decimal field is undefined', () => {
          beforeEach(() => {
            kilos = undefined
          })

          it('sets the field to undefined on the serializer', () => {
            const serializer = new MySerializer({
              kilos: undefined,
            })
            expect(serializer.render()).toEqual({ kilos: undefined })
          })
        })
      })

      context('with an explicit precision', () => {
        const subject = () => new MySerializer({ kilos }).render()

        class MySerializer extends DreamSerializer {
          @Attribute('decimal', { precision: 2 })
          public kilos: number
        }
        processDynamicallyDefinedSerializers(MySerializer)

        context('the decimal field is a number', () => {
          beforeEach(() => {
            kilos = 7.9351
          })

          it('rounds the decimal to the specified precision', () => {
            expect(subject()).toEqual({ kilos: 7.94 })
          })
        })

        context('the decimal field is null', () => {
          it('sets the field to null on the serializer', () => {
            expect(subject()).toEqual({ kilos: null })
          })
        })

        context('the decimal field is undefined', () => {
          class MySerializer extends DreamSerializer {
            @Attribute('decimal', { precision: 2 })
            public kilos: number
          }
          processDynamicallyDefinedSerializers(MySerializer)

          beforeEach(() => {
            kilos = undefined
          })

          it('sets the field to undefined on the serializer', () => {
            const serializer = new MySerializer({
              kilos: undefined,
            })
            expect(serializer.render()).toEqual({ kilos: undefined })
          })
        })
      })

      context('the field is specified using openapi syntax', () => {
        class MySerializer extends DreamSerializer {
          @Attribute({ type: 'number', format: 'decimal' })
          public kilos: number
        }
        processDynamicallyDefinedSerializers(MySerializer)

        beforeEach(() => {
          kilos = undefined
        })

        it('renders as decimal', () => {
          const serializer = new MySerializer({
            kilos: '123.456',
          })
          expect(serializer.render()).toEqual({ kilos: 123.456 })
        })

        context('with precision', () => {
          class MySerializer extends DreamSerializer {
            @Attribute({ type: 'number', format: 'decimal' }, { precision: 2 })
            public kilos: number
          }
          processDynamicallyDefinedSerializers(MySerializer)

          it('rounds to precision', () => {
            const serializer = new MySerializer({
              kilos: '123.456789',
            })
            expect(serializer.render()).toEqual({ kilos: 123.46 })
          })
        })
      })

      context('the field is specified using object with type syntax', () => {
        class MySerializer extends DreamSerializer {
          @Attribute({ type: 'decimal' })
          public kilos: number
        }
        processDynamicallyDefinedSerializers(MySerializer)

        beforeEach(() => {
          kilos = undefined
        })

        it('renders as decimal', () => {
          const serializer = new MySerializer({
            kilos: '123.456',
          })
          expect(serializer.render()).toEqual({ kilos: 123.456 })
        })
      })
    })

    context('decimal[]', () => {
      class MySerializer extends DreamSerializer {
        @Attribute('decimal[]', { precision: 2 })
        public kilos: number
      }
      processDynamicallyDefinedSerializers(MySerializer)

      it('rounds the decimals to the specified precision', () => {
        const kilos = [7.6789, 9.4321]
        const rendered = new MySerializer({ kilos }).render()
        expect(rendered).toEqual({ kilos: [7.68, 9.43] })
      })
    })
  })

  context('with casing specified', () => {
    context('snake casing is specified', () => {
      it('renders all attribute keys in snake case', () => {
        class MySerializer extends DreamSerializer {
          @Attribute('date')
          public createdAt: string
        }
        processDynamicallyDefinedSerializers(MySerializer)

        const serializer = new MySerializer({ createdAt: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
        expect(serializer.casing('snake').render()).toEqual({ created_at: '2002-10-02' })
      })
    })

    context('camel casing is specified', () => {
      it('renders all attribute keys in camel case', () => {
        class MySerializer extends DreamSerializer {
          @Attribute('date')
          public createdAt: string
        }
        processDynamicallyDefinedSerializers(MySerializer)

        const serializer = new MySerializer({ createdAt: DateTime.fromFormat('2002-10-02', 'yyyy-MM-dd') })
        expect(serializer.casing('camel').render()).toEqual({ createdAt: '2002-10-02' })
      })
    })
  })

  context('when passed a dream instance', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email: string
    }
    processDynamicallyDefinedSerializers(MySerializer)

    it('serializes the attributes of the dream', async () => {
      const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
      const serializer = new MySerializer(user)
      expect(serializer.render()).toEqual({ email: 'how@yadoin' })
    })
  })

  context('when defined with a functional attribute', () => {
    class MySerializer extends DreamSerializer {
      @Attribute()
      public email(attributes: any) {
        return attributes.email.replace(/@/, '#')
      }
    }
    processDynamicallyDefinedSerializers(MySerializer)

    it('serializes the attributes of the dream', () => {
      const serializer = new MySerializer({ email: 'fish@fish' })
      expect(serializer.render()).toEqual({ email: 'fish#fish' })
    })
  })

  context('when defined with an association', () => {
    context('RendersMany', () => {
      class PetSerializer extends DreamSerializer {
        @Attribute()
        public name: string

        @Attribute()
        public species: string
      }

      class UserSerializer extends DreamSerializer {
        @RendersMany(() => PetSerializer)
        public pets: Pet[]
      }
      processDynamicallyDefinedSerializers(PetSerializer, UserSerializer)

      it('identifies associations and serializes them using respecting serializers', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        await Pet.create({ user, name: 'aster', species: 'cat' })
        const reloaded = await user.load('pets').execute()

        const serializer = new UserSerializer(reloaded)
        expect(serializer.render()).toEqual({ pets: [{ name: 'aster', species: 'cat' }] })
      })

      it('renders many from this serializer and the ancestor', () => {
        class BalloonSerializer extends DreamSerializer {
          @Attribute()
          public color: string
        }

        class ChildSerializer extends UserSerializer {
          @RendersMany(() => BalloonSerializer)
          public balloons: Balloon[]
        }
        processDynamicallyDefinedSerializers(BalloonSerializer, ChildSerializer)

        const serializer = new ChildSerializer({
          pets: [{ name: 'aster', species: 'cat' }],
          balloons: [{ color: 'red' }],
        })

        expect(serializer.render()).toMatchObject({
          pets: [{ name: 'aster', species: 'cat' }],
          balloons: [{ color: 'red' }],
        })
      })

      // whenever an array is passed, we will always infer the
      // serializer at runtime using the data, since we can't
      // know which one to use in which context.
      context('an array of dreams is passed', () => {
        class NewUserSerializer extends DreamSerializer {
          @RendersMany([Pet, User], { serializerKey: 'summary' })
          public pets: Pet[]
        }
        processDynamicallyDefinedSerializers(NewUserSerializer)

        it('correctly serializes', async () => {
          let user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          user = await user.load('pets').execute()

          const serializer = new NewUserSerializer(user)
          expect(serializer.render()).toEqual({ pets: [{ id: pet.id, favoriteTreats: null }] })
        })
      })

      context('when the source option is passed', () => {
        class UserSerializerWithSource extends DreamSerializer {
          @RendersMany(() => PetSerializer, { source: 'pets' })
          public hooligans: Pet[]
        }
        processDynamicallyDefinedSerializers(UserSerializerWithSource)

        it('correctly serializes based on source', async () => {
          let user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          await Pet.create({ user, name: 'aster', species: 'cat' })
          user = await user.load('pets').execute()

          const serializer = new UserSerializerWithSource(user)
          expect(serializer.render()).toEqual({ hooligans: [{ name: 'aster', species: 'cat' }] })
        })

        context('when the source option is "passthroughData"', () => {
          class Howdy {
            public greeting: string

            constructor(greeting: string) {
              this.greeting = greeting
            }

            public get serializers() {
              return { default: 'HowdySerializer' }
            }
          }

          class UserSerializerWithSource extends DreamSerializer {
            @RendersMany({ source: DreamConst.passthrough })
            public howdys: Howdy[]
          }

          class HowdySerializer extends DreamSerializer {
            @Attribute()
            public greeting: string
          }
          processDynamicallyDefinedSerializers(UserSerializerWithSource, HowdySerializer)

          beforeEach(() => {
            const dreamApp = DreamApp.getOrFail()
            dreamApp.serializers['HowdySerializer'] = HowdySerializer
            vi.spyOn(DreamApp, 'getOrFail').mockReturnValue(dreamApp)
          })

          it('serializes the passthrough data', async () => {
            const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
            const howdys = [new Howdy('world')]

            const serializer = new UserSerializerWithSource(user).passthrough({ howdys })
            expect(serializer.render()).toEqual({ howdys: [{ greeting: 'world' }] })
          })
        })
      })

      context('when the association hasn’t been loaded', () => {
        it('throws NonLoadedAssociation', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          await Pet.create({ user, name: 'aster', species: 'cat' })

          const serializer = new UserSerializer(user)
          expect(() => serializer.render()).toThrow(NonLoadedAssociation)
        })

        context('when the serializer is optional', () => {
          class UserSerializer extends DreamSerializer {
            @RendersMany(() => PetSerializer, { optional: true })
            public pets: Pet[]
          }
          processDynamicallyDefinedSerializers(UserSerializer)

          it('renders the association as a blank array', async () => {
            let user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
            user = await user.load('pets').execute()

            const serializer = new UserSerializer(user)
            expect(serializer.render()).toEqual({ pets: [] })
          })

          context('when the association is not loaded', () => {
            it('throws NonLoadedAssociation', async () => {
              const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

              const serializer = new UserSerializer(user)
              expect(() => serializer.render()).toThrow(NonLoadedAssociation)
            })
          })
        })
      })

      context('when the field is undefined', () => {
        it('adds a blank array', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          await Pet.create({ user, name: 'aster', species: 'cat' })

          vi.spyOn(user, 'pets', 'get').mockReturnValue(undefined as any)

          const serializer = new UserSerializer(user)
          expect(serializer.render()).toEqual({ pets: [] })
        })
      })

      context('when nothing is passed', () => {
        class UserSerializer extends DreamSerializer {
          @RendersMany()
          public pets: Pet[]
        }
        processDynamicallyDefinedSerializers(UserSerializer)

        it('leverages the default serializer', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          pet = await pet.load('ratings').execute()

          const serializer = new UserSerializer({ pets: [pet] })
          expect(serializer.render()).toEqual({
            pets: [{ id: pet.id, name: 'aster', species: 'cat', ratings: [], favoriteDaysOfWeek: null }],
          })
        })

        context('when a serializer is not present on the model', () => {
          beforeEach(() => {
            vi.spyOn(Pet.prototype, 'serializers', 'get').mockReturnValue(undefined as any)
          })

          it('raises an exception on render', async () => {
            const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
            const pet = await Pet.create({ user, name: 'aster', species: 'cat' })

            const serializer = new UserSerializer({ pets: [pet] })
            expect(() => serializer.render()).toThrow(MissingSerializer)
          })
        })
      })

      context('when a config is passed as the first argument', () => {
        class UserSerializer<Nothing extends null, PassthroughData> extends DreamSerializer<
          Nothing,
          PassthroughData
        > {
          @RendersMany({ source: DreamConst.passthrough })
          public pets: Pet[]
        }
        processDynamicallyDefinedSerializers(UserSerializer)

        it('leverages the default serializer and applies the config', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          pet = await pet.load('ratings').execute()

          const serializer = new UserSerializer(null).passthrough({ pets: [pet] })
          expect(serializer.render()).toEqual({
            pets: [{ id: pet.id, name: 'aster', species: 'cat', ratings: [], favoriteDaysOfWeek: null }],
          })
        })
      })

      context('when no serializer class is passed', () => {
        class UserSerializer extends DreamSerializer {
          @RendersMany()
          public pets: Pet[]
        }
        processDynamicallyDefinedSerializers(UserSerializer)

        it('renders using the association’s default serializer', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat', favoriteDaysOfWeek: [1, 3, 7] })
          const post = await Post.create({ user })
          const rating = await Rating.create({ user, rateable: post, rating: 5 })

          const reloaded = await user.load('pets', 'ratings').execute()

          const serializer = new UserSerializer(reloaded)
          expect(serializer.render()).toEqual({
            pets: [
              {
                id: pet.id,
                name: 'aster',
                species: 'cat',
                favoriteDaysOfWeek: [1, 3, 7],
                ratings: [{ id: rating.id }],
              },
            ],
          })
        })
      })

      context('when a named serializer is specified', () => {
        class UserSerializer extends DreamSerializer {
          @RendersMany({ serializerKey: 'summary' })
          public pets: Pet[]
        }
        processDynamicallyDefinedSerializers(UserSerializer)

        it('renders using the association’s named serializer', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({
            user,
            name: 'aster',
            species: 'cat',
            favoriteTreats: ['ocean fish'],
          })

          const reloaded = await user.load('pets').execute()

          const serializer = new UserSerializer(reloaded)
          expect(serializer.render()).toEqual({
            pets: [
              {
                id: pet.id,
                favoriteTreats: ['ocean fish'],
              },
            ],
          })
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
      processDynamicallyDefinedSerializers(UserSerializer, PetSerializer)

      it('identifies associations and serializes them using respecting serializers', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
        pet = await pet.load('user').execute()

        const serializer = new PetSerializer(pet)
        expect(serializer.render()).toEqual({ user: { email: 'how@yadoin' } })
      })

      it('renders one from this serializer and the ancestor', () => {
        class PetSerializer extends DreamSerializer {
          @Attribute()
          public name: string

          @Attribute()
          public species: string
        }

        class BalloonSerializer extends DreamSerializer {
          @Attribute()
          public color: string
        }

        class UserSerializer extends DreamSerializer {
          @RendersOne(() => PetSerializer)
          public pet: Pet
        }

        class ChildSerializer extends UserSerializer {
          @RendersOne(() => BalloonSerializer)
          public balloon: Balloon
        }
        processDynamicallyDefinedSerializers(
          PetSerializer,
          BalloonSerializer,
          UserSerializer,
          ChildSerializer
        )

        const serializer = new ChildSerializer({
          pet: { name: 'aster', species: 'cat' },
          balloon: { color: 'red' },
        })

        expect(serializer.render()).toMatchObject({
          pet: { name: 'aster', species: 'cat' },
          balloon: { color: 'red' },
        })
      })

      context('when the association hasn’t been loaded', () => {
        it('throws NonLoadedAssociation', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          const reloadedPet = await Pet.find(pet.id)

          const serializer = new PetSerializer(reloadedPet)
          expect(() => serializer.render()).toThrow(NonLoadedAssociation)
        })

        context('when the serializer is optional', () => {
          class PetSerializer extends DreamSerializer {
            @RendersOne(() => UserSerializer, { optional: true })
            public user: User
          }
          processDynamicallyDefinedSerializers(PetSerializer)

          it('renders the association as undefined', async () => {
            const pet = await Pet.create({ name: 'aster', species: 'cat' })
            const reloadedPet = await Pet.preload('user').find(pet.id)

            const serializer = new PetSerializer(reloadedPet)
            expect(serializer.render()).toEqual({ user: null })
          })
        })
      })

      context('when the field is undefined', () => {
        it('sets to null', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat' })

          vi.spyOn(pet, 'user', 'get').mockReturnValue(undefined as any)

          const serializer = new PetSerializer(pet)
          expect(serializer.render()).toEqual({ user: null })
        })
      })

      context('when the source option is passed', () => {
        class PetSerializer extends DreamSerializer {
          @RendersOne(() => UserSerializer, { source: 'user' })
          public owner: User
        }
        processDynamicallyDefinedSerializers(PetSerializer)

        it('correctly serializes based on source', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat' })

          const serializer = new PetSerializer(pet)
          expect(serializer.render()).toEqual({ owner: { email: 'how@yadoin' } })
        })

        context('when the source option is "passthroughData"', () => {
          class Howdy {
            public greeting: string

            constructor(greeting: string) {
              this.greeting = greeting
            }

            public get serializers() {
              return { default: 'HowdySerializer' }
            }
          }

          class UserSerializerWithSource extends DreamSerializer {
            @RendersOne({ source: DreamConst.passthrough })
            public howdy: Howdy
          }

          class HowdySerializer extends DreamSerializer {
            @Attribute()
            public greeting: string
          }
          processDynamicallyDefinedSerializers(UserSerializerWithSource, HowdySerializer)

          beforeEach(() => {
            const dreamApp = DreamApp.getOrFail()
            dreamApp.serializers['HowdySerializer'] = HowdySerializer
            vi.spyOn(DreamApp, 'getOrFail').mockReturnValue(dreamApp)
          })

          it('serializes the passthrough data', async () => {
            const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
            const howdy = new Howdy('world')

            const serializer = new UserSerializerWithSource(user).passthrough({ howdy })
            expect(serializer.render()).toEqual({ howdy: { greeting: 'world' } })
          })
        })
      })

      context('with flatten set on RendersOne', () => {
        class UserSerializer extends DreamSerializer {
          @Attribute()
          public email: string

          @Attribute()
          public name: string
        }

        class PetSerializerFlattened extends DreamSerializer {
          @RendersOne(() => UserSerializer, { flatten: true })
          public user: User
        }
        processDynamicallyDefinedSerializers(UserSerializer, PetSerializerFlattened)

        let user: User

        beforeEach(async () => {
          user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'Chalupa Jones' })
        })

        it('flattens association attributes into parent serializer', async () => {
          let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          pet = await pet.load('user').execute()

          const serializer = new PetSerializerFlattened(pet)
          expect(serializer.render()).toEqual({ email: 'how@yadoin', name: 'Chalupa Jones' })
        })

        context('when the attribute is computed', () => {
          class UserSerializer extends DreamSerializer {
            @Attribute('date')
            public birthdate: CalendarDate
          }

          class PetSerializerFlattened extends DreamSerializer {
            @RendersOne(() => UserSerializer, { flatten: true })
            public user: User
          }
          processDynamicallyDefinedSerializers(UserSerializer, PetSerializerFlattened)

          it('correctly renders the computed value', async () => {
            const today = CalendarDate.today()
            const user = await User.create({
              email: 'how@yadoin2',
              password: 'howyadoin',
              birthdate: today,
            })
            let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
            pet = await pet.load('user').execute()

            const serializer = new PetSerializerFlattened(pet)
            expect(serializer.render()).toEqual({ birthdate: today.toISO() })
          })
        })
      })

      context('when no serializer class is passed', () => {
        class PetSerializer extends DreamSerializer {
          @RendersOne()
          public user: User
        }
        processDynamicallyDefinedSerializers(PetSerializer)

        it('renders using the association’s default serializer', async () => {
          const user = await User.create({
            email: 'how@yadoin',
            password: 'howyadoin',
            name: 'Charlie Brown',
            birthdate: CalendarDate.fromISO('1983-07-29'),
            favoriteWord: 'chalupas',
          })
          let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          pet = await pet.load('user', 'userSettings').execute()

          const serializer = new PetSerializer(pet)
          expect(serializer.render()).toEqual({
            user: { id: user.id, name: 'Charlie Brown', birthdate: '1983-07-29', userSettings: null },
          })
        })
      })

      context('when a named serializer is specified', () => {
        class PetSerializer extends DreamSerializer {
          @RendersOne({ serializerKey: 'summary' })
          public user: User
        }
        processDynamicallyDefinedSerializers(PetSerializer)

        it('renders using the association’s named serializer', async () => {
          const user = await User.create({
            email: 'how@yadoin',
            password: 'howyadoin',
            name: 'Charlie Brown',
            birthdate: CalendarDate.fromISO('1983-07-29'),
            favoriteWord: 'chalupas',
          })
          let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          pet = await pet.load('user').execute()

          const serializer = new PetSerializer(pet)
          expect(serializer.render()).toEqual({
            user: { id: user.id, favoriteWord: 'chalupas' },
          })
        })
      })
    })

    context('with attribute delegations', () => {
      it('returns the delegated attributes in the payload', async () => {
        class PetSerializer extends DreamSerializer {
          @Attribute('string', { delegate: 'user' })
          public email: string
        }
        processDynamicallyDefinedSerializers(PetSerializer)

        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
        pet = await pet.load('user').execute()

        const serializer = new PetSerializer(pet)
        expect(serializer.render()).toEqual({ email: 'how@yadoin' })
      })

      context('when the specified delegation target does not exist', () => {
        it('throws DelegationTargetDoesNotExist', async () => {
          class PetSerializer extends DreamSerializer {
            @Attribute('string', { delegate: 'user2' })
            public email: string
          }
          processDynamicallyDefinedSerializers(PetSerializer)

          const pet = await Pet.create({ name: 'aster', species: 'cat' })

          const serializer = new PetSerializer(pet)

          expect(() => serializer.render()).toThrowError(DelegationTargetDoesNotExist)
        })
      })

      context('with casing', () => {
        it('returns the delegated attributes in the correct casing in the payload', async () => {
          class PetSerializer extends DreamSerializer {
            @Attribute('date', { delegate: 'user' })
            public updatedAt: string
          }
          processDynamicallyDefinedSerializers(PetSerializer)

          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
          pet = await pet.load('user').execute()

          const serializer = new PetSerializer(pet)
          expect(serializer.casing('camel').render()).toEqual({ updatedAt: user.updatedAt.toISODate() })
        })
      })
    })

    context('when nothing is passed', () => {
      class UserSerializer extends DreamSerializer {
        @RendersOne()
        public pet: Pet
      }
      processDynamicallyDefinedSerializers(UserSerializer)

      it('leverages the default serializer', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
        pet = await pet.load('ratings').execute()

        const serializer = new UserSerializer({ pet })
        expect(serializer.render()).toEqual({
          pet: { id: pet.id, name: 'aster', species: 'cat', ratings: [], favoriteDaysOfWeek: null },
        })
      })

      context('when a serializer is not present on the model', () => {
        beforeEach(() => {
          vi.spyOn(Pet.prototype, 'serializers', 'get').mockReturnValue(undefined as any)
        })

        it('raises an exception on render', async () => {
          const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
          const pet = await Pet.create({ user, name: 'aster', species: 'cat' })

          const serializer = new UserSerializer({ pet })
          expect(() => serializer.render()).toThrow(MissingSerializer)
        })
      })
    })

    context('when a config is passed as the first argument', () => {
      class UserSerializer<Nothing extends null, PassthroughData> extends DreamSerializer<
        Nothing,
        PassthroughData
      > {
        @RendersOne({ source: DreamConst.passthrough })
        public pet: Pet
      }
      processDynamicallyDefinedSerializers(UserSerializer)

      it('leverages the default serializer and applies the config', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        let pet = await Pet.create({ user, name: 'aster', species: 'cat' })
        pet = await pet.load('ratings').execute()

        const serializer = new UserSerializer(null).passthrough({ pet: pet })
        expect(serializer.render()).toEqual({
          pet: { id: pet.id, name: 'aster', species: 'cat', ratings: [], favoriteDaysOfWeek: null },
        })
      })
    })
  })

  context('with passthrough data applied', () => {
    class ChildSerializer<
      DataType extends object,
      PassthroughData extends { howyadoin: string },
    > extends DreamSerializer<DataType, PassthroughData> {
      @Attribute()
      public howyadoin() {
        return this.$passthroughData.howyadoin
      }
    }

    class IntermediateSerializer extends DreamSerializer {
      @RendersOne(() => ChildSerializer<any, any>)
      public child: any

      @Attribute()
      public howyadoin() {
        return this.$passthroughData.howyadoin
      }
    }

    class ParentSerializer extends DreamSerializer {
      @RendersOne(() => IntermediateSerializer)
      public child: any
    }
    processDynamicallyDefinedSerializers(ChildSerializer, IntermediateSerializer, ParentSerializer)

    it('correctly sends passthrough data to child serializers', () => {
      const serializer = new ParentSerializer({ child: { child: {} } }).passthrough({
        howyadoin: 'howyadoin',
      })
      expect(serializer.render()).toEqual({
        child: { howyadoin: 'howyadoin', child: { howyadoin: 'howyadoin' } },
      })
    })
  })

  context('with duplicate attributes applied on a child and parent serializer', () => {
    class ChildSerializer extends DreamSerializer {
      @Attribute()
      public childattr() {
        return 123
      }

      @Attribute()
      public howyadoin() {
        return 'howyadoin'
      }
    }

    class ParentSerializer extends DreamSerializer {
      @RendersOne(() => ChildSerializer, { flatten: true })
      public child: any

      @Attribute()
      public howyadoin() {
        return 'superhowyadoin'
      }
    }
    processDynamicallyDefinedSerializers(ChildSerializer, ParentSerializer)

    it('applies attribute def from parent, discards child', () => {
      const serializer = new ParentSerializer({ child: 1 })
      expect(serializer.render()).toEqual({ howyadoin: 'superhowyadoin', childattr: 123 })
    })
  })
})
