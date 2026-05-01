import DreamSerializer from '../../../../src/serializer/DreamSerializer.js'
import CalendarDate from '../../../../src/utils/datetime/CalendarDate.js'
import Latex from '../../../../test-app/app/models/Balloon/Latex.js'
import Collar from '../../../../test-app/app/models/Collar.js'
import Pet from '../../../../test-app/app/models/Pet.js'
import User from '../../../../test-app/app/models/User.js'

describe('DreamSerializer#delegatedAttribute', () => {
  it('delegates value and type to the specified target', () => {
    const birthdate = CalendarDate.fromISO('1950-10-02')
    const user = User.new({ name: 'Charlie', birthdate })
    const pet = Pet.new({ user, name: 'Snoopy' })

    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data)
        // `optional: true` only affects OpenAPI generation (in Psychic), but including here
        // to ensure it is supported by types
        .delegatedAttribute('user', 'name', { optional: true })
        // ensure `optional: true` is supported by types when delegating to a @deco.Virtual column
        .delegatedAttribute('user', 'randoVirtual', { optional: true })
        // passing a generic argument here just to ensure the types stay correct
        .delegatedAttribute<Pet>('user', 'birthdate')

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      name: 'Charlie',
      randoVirtual: null,
      birthdate: birthdate.toISO(),
    })
  })

  it('supports specifying a default value', () => {
    const user = User.new({})
    const pet = Pet.new({ user, name: 'Snoopy' })

    const MySerializer = (data: Pet) =>
      DreamSerializer(Pet, data).delegatedAttribute('user', 'name', {
        default: 'Woodstock',
        openapi: 'string',
      })

    const serializer = MySerializer(pet)

    expect(serializer.render()).toEqual({
      name: 'Woodstock',
    })
  })

  context('when the target object is null', () => {
    it('returns null', () => {
      const pet = Pet.new({ user: null, name: 'Snoopy' })

      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data)
          .delegatedAttribute('user', 'name', { openapi: 'string' })
          // passing a generic argument here just to ensure the types stay correct
          .delegatedAttribute<Pet>('user', 'birthdate', { openapi: 'date' })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        name: null,
        birthdate: null,
      })
    })

    it('supports specifying a default value', () => {
      const pet = Pet.new({ user: null, name: 'Snoopy' })

      const MySerializer = (data: Pet) =>
        DreamSerializer(Pet, data).delegatedAttribute('user', 'name', {
          default: 'Woodstock',
          openapi: 'string',
        })

      const serializer = MySerializer(pet)

      expect(serializer.render()).toEqual({
        name: 'Woodstock',
      })
    })

    context('with optional: true', () => {
      it('renders the value as null (optional is an OpenAPI-only marker)', () => {
        const pet = Pet.new({ user: null, name: 'Snoopy' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .delegatedAttribute('user', 'name', { optional: true })
            .delegatedAttribute('user', 'randoVirtual', { optional: true })

        const serializer = MySerializer(pet)

        expect(serializer.render()).toEqual({
          name: null,
          randoVirtual: null,
        })
      })
    })

    context('with required: false', () => {
      it('omits the key from the rendered output', () => {
        const pet = Pet.new({ user: null, name: 'Snoopy' })

        const MySerializer = (data: Pet) =>
          DreamSerializer(Pet, data)
            .delegatedAttribute('user', 'name', { required: false })
            .delegatedAttribute('user', 'randoVirtual', { required: false })

        const serializer = MySerializer(pet)

        expect(serializer.render()).toEqual({})
      })
    })
  })

  // The delegated 'type' (STI discriminator) branch is gated by a stricter
  // options type than other Dream column delegations: `default` is intentionally
  // excluded to prevent a misleading-response footgun. Substituting a string
  // discriminator (e.g. `default: 'Latex'`) when the association is actually
  // missing makes the response indistinguishable from "association is present
  // and is a Latex," which is the same class of failure that motivates excluding
  // `default` on `attribute('type')`. `optional: true` and `required: false`
  // remain available because they declare absence honestly (nullable / omitted)
  // rather than masking it.
  context('when delegating to an STI `type` column', () => {
    it('renders the discriminator value when the association is present', () => {
      const balloon = Latex.new({ color: 'red' })
      const collar = Collar.new({ balloon })

      const MySerializer = (data: Collar) =>
        DreamSerializer(Collar, data).delegatedAttribute('balloon', 'type')

      expect(MySerializer(collar).render()).toEqual({ type: 'Latex' })
    })

    context('when the delegated-through association is null', () => {
      it('renders null by default', () => {
        const collar = Collar.new({ balloon: null })

        const MySerializer = (data: Collar) =>
          DreamSerializer(Collar, data).delegatedAttribute('balloon', 'type')

        expect(MySerializer(collar).render()).toEqual({ type: null })
      })

      it('omits the key when required: false', () => {
        const collar = Collar.new({ balloon: null })

        const MySerializer = (data: Collar) =>
          DreamSerializer(Collar, data).delegatedAttribute('balloon', 'type', { required: false })

        expect(MySerializer(collar).render()).toEqual({})
      })

      it('renders null with optional: true (OpenAPI-only marker)', () => {
        const collar = Collar.new({ balloon: null })

        const MySerializer = (data: Collar) =>
          DreamSerializer(Collar, data).delegatedAttribute('balloon', 'type', { optional: true })

        expect(MySerializer(collar).render()).toEqual({ type: null })
      })
    })
  })
})
