import TimeWithoutZone from '../../../../../src/utils/datetime/TimeWithoutZone.js'
import ModelForDatabaseTypeSpec from '../../../../../test-app/app/models/ModelForDatabaseTypeSpec.js'

describe('database data types', () => {
  describe('timeWithoutZone', () => {
    it('saves and retrieves time without zone with microseconds', async () => {
      const timeWithMicroseconds = TimeWithoutZone.fromObject({
        hour: 14,
        minute: 30,
        second: 45,
        millisecond: 123,
        microsecond: 456,
      })

      const model = await ModelForDatabaseTypeSpec.create({
        myTimeWithoutZone: timeWithMicroseconds,
      })

      expect(model.myTimeWithoutZone).toBeInstanceOf(TimeWithoutZone)
      expect(model.myTimeWithoutZone?.hour).toEqual(14)
      expect(model.myTimeWithoutZone?.minute).toEqual(30)
      expect(model.myTimeWithoutZone?.second).toEqual(45)
      expect(model.myTimeWithoutZone?.millisecond).toEqual(123)
      expect(model.myTimeWithoutZone?.microsecond).toEqual(456)

      // Reload from database to ensure microseconds persisted
      const reloaded = await ModelForDatabaseTypeSpec.find(model.id)
      expect(reloaded?.myTimeWithoutZone).toBeInstanceOf(TimeWithoutZone)
      expect(reloaded?.myTimeWithoutZone?.hour).toEqual(14)
      expect(reloaded?.myTimeWithoutZone?.minute).toEqual(30)
      expect(reloaded?.myTimeWithoutZone?.second).toEqual(45)
      expect(reloaded?.myTimeWithoutZone?.millisecond).toEqual(123)
      expect(reloaded?.myTimeWithoutZone?.microsecond).toEqual(456)
    })

    it('handles null values', async () => {
      const model = await ModelForDatabaseTypeSpec.create({
        myTimeWithoutZone: null,
      })

      expect(model.myTimeWithoutZone).toBeNull()

      const reloaded = await ModelForDatabaseTypeSpec.find(model.id)
      expect(reloaded?.myTimeWithoutZone).toBeNull()
    })

    it('preserves time components across day boundaries', async () => {
      // Test that time without zone doesn't have date-related issues
      const lateNightTime = TimeWithoutZone.fromObject({
        hour: 23,
        minute: 59,
        second: 59,
        millisecond: 999,
        microsecond: 999,
      })

      const model = await ModelForDatabaseTypeSpec.create({
        myTimeWithoutZone: lateNightTime,
      })

      const reloaded = await ModelForDatabaseTypeSpec.find(model.id)
      expect(reloaded?.myTimeWithoutZone?.hour).toEqual(23)
      expect(reloaded?.myTimeWithoutZone?.minute).toEqual(59)
      expect(reloaded?.myTimeWithoutZone?.second).toEqual(59)
      expect(reloaded?.myTimeWithoutZone?.millisecond).toEqual(999)
      expect(reloaded?.myTimeWithoutZone?.microsecond).toEqual(999)
    })

    it('preserves time through updates', async () => {
      const initialTime = TimeWithoutZone.fromObject({
        hour: 10,
        minute: 15,
        second: 30,
        millisecond: 500,
        microsecond: 250,
      })

      const model = await ModelForDatabaseTypeSpec.create({
        myTimeWithoutZone: initialTime,
      })

      const updatedTime = TimeWithoutZone.fromObject({
        hour: 16,
        minute: 45,
        second: 12,
        millisecond: 789,
        microsecond: 123,
      })

      await model.update({ myTimeWithoutZone: updatedTime })

      const reloaded = await ModelForDatabaseTypeSpec.find(model.id)
      expect(reloaded?.myTimeWithoutZone?.hour).toEqual(16)
      expect(reloaded?.myTimeWithoutZone?.minute).toEqual(45)
      expect(reloaded?.myTimeWithoutZone?.second).toEqual(12)
      expect(reloaded?.myTimeWithoutZone?.millisecond).toEqual(789)
      expect(reloaded?.myTimeWithoutZone?.microsecond).toEqual(123)
    })
  })
})
