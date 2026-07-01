import InvalidColumnName from '../../../src/errors/InvalidColumnName.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

// DREAM-SQLI-01 (defense-in-depth): runtime column identifiers passed to
// order/pluck/dynamic-where are routed through the schema `validateColumn` guard
// so an unknown *plain* identifier throws a Dream InvalidColumnName error before
// reaching the database. Namespaced / aliased / association forms are left on
// their existing path and must continue to pass.
describe('runtime column identifier validation (DREAM-SQLI-01)', () => {
  context('order', () => {
    it('throws InvalidColumnName for an unknown plain column', async () => {
      await expect(
        User.query()
          .order('nonExistentColumn' as any)
          .all()
      ).rejects.toThrow(InvalidColumnName)
    })

    it('throws InvalidColumnName for an unknown plain column in object form', async () => {
      await expect(
        User.query()
          .order({ nonExistentColumn: 'asc' } as any)
          .all()
      ).rejects.toThrow(InvalidColumnName)
    })

    it('still accepts a valid plain column', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const records = await User.query().order('email').all()
      expect(records.map(r => r.id)).toContain(user.id)
    })

    it('still accepts a namespaced / association-aliased order column', async () => {
      // 'balloon.volume' is a table-aliased identifier (association alias + column)
      // and must bypass plain-column validation and continue to compile/run.
      const results = await Pet.innerJoin('collars', 'balloon').order('balloon.volume').all()
      expect(results).toBeDefined()
    })
  })

  context('pluck', () => {
    it('throws InvalidColumnName for an unknown plain column', async () => {
      await expect(User.query().pluck('nonExistentColumn' as any)).rejects.toThrow(InvalidColumnName)
    })

    it('still accepts a valid plain column', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const emails = await User.query().pluck('email')
      expect(emails).toContain(user.email)
    })

    it('still accepts a namespaced pluck column after a join', async () => {
      await Pet.create({ name: 'Aster' })
      const plucked = await Pet.query().pluck('pets.name' as any)
      expect(plucked).toContain('Aster')
    })
  })

  context('where', () => {
    it('throws InvalidColumnName for an unknown plain where key', async () => {
      await expect(
        User.query()
          .where({ nonExistentColumn: 'x' } as any)
          .all()
      ).rejects.toThrow(InvalidColumnName)
    })

    it('still accepts a valid plain where key', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const records = await User.query().where({ email: 'fred@frewd' }).all()
      expect(records.map(r => r.id)).toEqual([user.id])
    })

    it('still accepts a namespaced where key', async () => {
      const user = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
      const records = await User.query()
        .where({ 'users.email': 'fred@frewd' } as any)
        .all()
      expect(records.map(r => r.id)).toEqual([user.id])
    })
  })
})
