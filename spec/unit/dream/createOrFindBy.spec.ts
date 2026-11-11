import Dream from '../../../src/Dream.js'
import PostgresQueryDriver from '../../../src/dream/QueryDriver/Postgres.js'
import CreateOrFindByFailedToCreateAndFind from '../../../src/errors/CreateOrFindByFailedToCreateAndFind.js'
import Collar from '../../../test-app/app/models/Collar.js'
import Composition from '../../../test-app/app/models/Composition.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.createOrFindBy', () => {
  context('no underlying conflicts to prevent save', () => {
    it('creates the underlying model in the db', async () => {
      const u = await User.createOrFindBy({ email: 'fred@frewd' }, { createWith: { password: 'howyadoin' } })
      const user = await User.find(u.id)
      expect(user!.email).toEqual('fred@frewd')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })
  })

  context('when a conflicting record already exists in the db', () => {
    it('returns the existing record, leaving existing attributes untouched', async () => {
      const originalUser = await User.create({ email: 'fred@fred', password: 'howyadoin' })
      const u = await User.createOrFindBy(
        { email: 'fred@fred' },
        { createWith: { password: 'nothowyadoin' } }
      )
      const user = await User.find(u.id)
      expect(user!.email).toEqual('fred@fred')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
      expect(u).toMatchDreamModel(originalUser)
    })
  })

  context(
    'when createOrFindBy attribute doesn’t match an existing record, but a `createWith` field conflicts with an existing record',
    () => {
      beforeEach(async () => {
        await User.create({
          email: 'fred@fred',
          socialSecurityNumber: '1234567890',
          password: 'howyadoin',
        })
      })

      it('throws CreateOrFindByFailedToCreateAndFind', async () => {
        await expect(
          User.createOrFindBy(
            { email: 'howya@doin' },
            { createWith: { socialSecurityNumber: '1234567890', password: 'nothowyadoin' } }
          )
        ).rejects.toThrow(CreateOrFindByFailedToCreateAndFind)
      })

      it('names the `createWith` attribute the violated unique index covers', async () => {
        const promise = User.createOrFindBy(
          { email: 'howya@doin' },
          { createWith: { socialSecurityNumber: '1234567890', password: 'nothowyadoin' } }
        )

        await expect(promise).rejects.toThrow(/covers the `createWith` attribute socialSecurityNumber/)
        await expect(promise).rejects.not.toThrow(/Possible causes:/)
      })

      it('lists the possible causes when the database does not identify the violated unique index', async () => {
        vi.spyOn(PostgresQueryDriver, 'violatedUniqueIndexColumns').mockResolvedValue(null)

        const promise = User.createOrFindBy(
          { email: 'howya@doin' },
          { createWith: { socialSecurityNumber: '1234567890', password: 'nothowyadoin' } }
        )

        await expect(promise).rejects.toThrow(/Possible causes:/)
        await expect(promise).rejects.toThrow(/a `createWith` value conflicts/)
        await expect(promise).rejects.toThrow(/a find attribute outside the violated unique index differs/)
        await expect(promise).rejects.toThrow(/a hook changed a find attribute/)
        await expect(promise).rejects.not.toThrow(/hidden by/)
      })
    }
  )

  context('when the conflicting record is hidden by a default scope', () => {
    it('throws CreateOrFindByFailedToCreateAndFind naming the default scope that hides the record', async () => {
      const pet = await Pet.create({ species: 'cat', uniqueColumn: 'garfield' })
      await pet.destroy()

      const promise = Pet.createOrFindBy({ uniqueColumn: 'garfield' })

      await expect(promise).rejects.toThrow(CreateOrFindByFailedToCreateAndFind)
      await expect(promise).rejects.toThrow(/likely hidden by the default scope "dream:SoftDelete"/)
      await expect(promise).rejects.not.toThrow(/Possible causes:/)
    })

    it('lists every removable default scope as a candidate when the model has several', async () => {
      const pet = await Pet.create({ species: 'dog' })
      const collar = await Collar.create({ pet, hidden: true })

      const promise = Collar.createOrFindBy({ id: collar.id }, { createWith: { pet } })

      await expect(promise).rejects.toThrow(CreateOrFindByFailedToCreateAndFind)
      await expect(promise).rejects.toThrow(
        /likely hidden by one of the default scopes "dream:SoftDelete", "hideHiddenCollars"/
      )
    })

    it('names the default scope when a `createWith` value is not in the violated unique index', async () => {
      const pet = await Pet.create({ species: 'cat', uniqueColumn: 'garfield' })
      await pet.destroy()

      const promise = Pet.createOrFindBy({ uniqueColumn: 'garfield' }, { createWith: { name: 'Nermal' } })

      await expect(promise).rejects.toThrow(/likely hidden by the default scope "dream:SoftDelete"/)
      await expect(promise).rejects.not.toThrow(/`createWith`/)
    })

    it('names the default scope when the violated unique index covers a `createWith` attribute and every find attribute', async () => {
      vi.spyOn(PostgresQueryDriver, 'violatedUniqueIndexColumns').mockResolvedValue(['unique_column', 'name'])
      const pet = await Pet.create({ species: 'cat', name: 'Nermal', uniqueColumn: 'garfield' })
      await pet.destroy()

      const promise = Pet.createOrFindBy({ uniqueColumn: 'garfield' }, { createWith: { name: 'Nermal' } })

      await expect(promise).rejects.toThrow(/likely hidden by the default scope "dream:SoftDelete"/)
      await expect(promise).rejects.not.toThrow(/`createWith`/)
    })

    it('lists the hidden record as a possible cause when the database does not identify the violated unique index', async () => {
      vi.spyOn(PostgresQueryDriver, 'violatedUniqueIndexColumns').mockResolvedValue(null)
      const pet = await Pet.create({ species: 'cat', uniqueColumn: 'garfield' })
      await pet.destroy()

      const promise = Pet.createOrFindBy({ uniqueColumn: 'garfield' })

      await expect(promise).rejects.toThrow(/Possible causes:/)
      await expect(promise).rejects.toThrow(
        /a record matching the find attributes exists but is hidden by the default scope "dream:SoftDelete"/
      )
      await expect(promise).rejects.not.toThrow(/`createWith`/)
    })
  })

  context(
    'when a `createWith` value conflicts with a visible record and a record matching the find attributes is hidden by a default scope',
    () => {
      beforeEach(async () => {
        await Pet.create({ species: 'dog', name: 'Y', uniqueColumn: 'u' })
        const hiddenPet = await Pet.create({ species: 'cat', name: 'X', uniqueColumn: 'other' })
        await hiddenPet.destroy()
      })

      it('names the conflicting `createWith` attribute rather than blaming the default scope', async () => {
        const promise = Pet.createOrFindBy({ name: 'X' }, { createWith: { uniqueColumn: 'u' } })

        await expect(promise).rejects.toThrow(CreateOrFindByFailedToCreateAndFind)
        await expect(promise).rejects.toThrow(/covers the `createWith` attribute uniqueColumn/)
        await expect(promise).rejects.not.toThrow(/hidden by/)
      })
    }
  )

  context('after create lifecycle hooks', () => {
    it('are called when creating', async () => {
      const pet = await Pet.createOrFindBy({ species: 'dog' }, { createWith: { name: 'change me' } })

      expect(pet.name).toEqual('changed by create hook')
    })

    it('are not called when finding', async () => {
      const existingPet = await Pet.create({ species: 'dog', name: 'Snoopy', uniqueColumn: 'Snoopy' })
      const pet = await Pet.createOrFindBy(
        { species: 'dog' },
        { createWith: { name: 'change me', uniqueColumn: 'Snoopy' } }
      )

      expect(pet).toMatchDreamModel(existingPet)
      expect(pet.name).toEqual('Snoopy')
    })

    it('are NOT called when creating when skipHooks is passed', async () => {
      const pet = await Pet.createOrFindBy(
        { species: 'dog' },
        { createWith: { name: 'change me' }, skipHooks: true }
      )

      expect(pet.name).toEqual('change me')
    })
  })

  context('when a non-foreign-key-constraint related issue crops up', () => {
    beforeEach(() => {
      vi.spyOn(Dream.prototype, 'save').mockImplementation(
        () => new Promise((accept, reject) => reject(new Error('unexpected error!')))
      )
    })

    it('does not mask error', async () => {
      await expect(
        User.createOrFindBy({ email: 'fred@fred' }, { createWith: { password: 'nothowyadoin' } })
      ).rejects.toThrow()
    })
  })

  it('respects associations in primary opts', async () => {
    const user = await User.create({ email: 'fred@fred.fred', password: 'howyadoin' })
    const composition = await Composition.createOrFindBy({ user }, { createWith: { content: 'howyadoin' } })
    expect(composition.userId).toEqual(user.id)
  })

  it('respects associations in secondary opts', async () => {
    const user = await User.create({ email: 'fred@fred.fred', password: 'howyadoin' })
    const composition = await Composition.createOrFindBy({ content: 'howyadoin' }, { createWith: { user } })
    expect(composition.userId).toEqual(user.id)
  })

  context(
    'with an array column in the find key, when a unique column conflicts with an existing record',
    () => {
      let existingPet: Pet

      beforeEach(async () => {
        existingPet = await Pet.create({
          species: 'cat',
          uniqueColumn: 'garfield',
          favoriteTreats: ['chicken', 'tuna'],
        })
      })

      it('returns the existing record whose array equals the given array', async () => {
        const pet = await Pet.createOrFindBy({
          uniqueColumn: 'garfield',
          favoriteTreats: ['chicken', 'tuna'],
        })

        expect(pet).toMatchDreamModel(existingPet)
        expect(await Pet.count()).toEqual(1)
      })

      it('throws CreateOrFindByFailedToCreateAndFind when the given array has the same elements in a different order', async () => {
        await expect(
          Pet.createOrFindBy({ uniqueColumn: 'garfield', favoriteTreats: ['tuna', 'chicken'] })
        ).rejects.toThrow(CreateOrFindByFailedToCreateAndFind)
      })

      it('throws CreateOrFindByFailedToCreateAndFind when the given array holds only some of the elements', async () => {
        await expect(
          Pet.createOrFindBy({ uniqueColumn: 'garfield', favoriteTreats: ['chicken'] })
        ).rejects.toThrow(CreateOrFindByFailedToCreateAndFind)
      })

      it('does not blame a default scope when the conflicting record is visible', async () => {
        await expect(
          Pet.createOrFindBy({ uniqueColumn: 'garfield', favoriteTreats: ['chicken'] })
        ).rejects.not.toThrow(/hidden by/)
      })

      it('returns the existing record whose array is empty when given an empty array', async () => {
        const emptyPet = await Pet.create({ species: 'cat', uniqueColumn: 'nermal', favoriteTreats: [] })

        expect(await Pet.createOrFindBy({ uniqueColumn: 'nermal', favoriteTreats: [] })).toMatchDreamModel(
          emptyPet
        )
        expect(await Pet.count()).toEqual(2)
      })

      it('returns the existing record whose array is null when given null', async () => {
        const nullPet = await Pet.create({ species: 'cat', uniqueColumn: 'nermal', favoriteTreats: null })

        expect(await Pet.createOrFindBy({ uniqueColumn: 'nermal', favoriteTreats: null })).toMatchDreamModel(
          nullPet
        )
        expect(await Pet.count()).toEqual(2)
      })
    }
  )

  context('with an encrypted column passed to createWith', () => {
    it('encrypts the value before persisting it', async () => {
      const u = await User.createOrFindBy(
        { email: 'fred@frewd' },
        { createWith: { password: 'howyadoin', secret: 'my secret' } }
      )
      const user = await User.find(u.id)
      expect(user!.secret).toEqual('my secret')
      expect(typeof user!.getAttribute('encryptedSecret')).toEqual('string')
      expect(user!.getAttribute('encryptedSecret')).not.toEqual('my secret')
    })
  })
})

// type tests intentionally skipped, since they will fail on build instead.
context.skip('type tests', () => {
  it('rejects virtual and encrypted columns in the find key', async () => {
    await User.createOrFindBy({
      // @ts-expect-error virtual columns cannot be used as a find key
      password: 'howyadoin',
    })
    await User.createOrFindBy({
      // @ts-expect-error encrypted columns cannot be used as a find key
      secret: 'howyadoin',
    })
  })
})
