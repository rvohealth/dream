import { ClockTimeTz } from '../../../src/package-exports/index.js'
import CalendarDate from '../../../src/utils/datetime/CalendarDate.js'
import ClockTime from '../../../src/utils/datetime/ClockTime.js'
import { DateTime } from '../../../src/utils/datetime/DateTime.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import ModelForDatabaseTypeSpec from '../../../test-app/app/models/ModelForDatabaseTypeSpec.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream#isDirty', () => {
  it('reflects being dirty when dirty', async () => {
    const user = User.new({ email: 'ham@', password: 'chalupas' })
    expect(user.isDirty).toEqual(true)

    await user.save()
    expect(user.isDirty).toEqual(false)

    user.email = 'ham@'
    expect(user.isDirty).toEqual(false)

    user.email = 'fish@'
    expect(user.isDirty).toEqual(true)

    user.email = 'ham@'
    expect(user.isDirty).toEqual(false)
  })

  context('DateTime', () => {
    let user: User

    beforeEach(async () => {
      user = await User.create({
        email: 'ham@',
        password: 'chalupas',
      })
    })

    context('when the DateTime is a different object at the same time', () => {
      it('is false', () => {
        user.updatedAt = DateTime.fromISO(user.updatedAt.toISO())
        expect(user.isDirty).toBe(false)
      })
    })

    context('when the DateTime is a different time', () => {
      it('is true', () => {
        user.updatedAt = user.updatedAt.plus({ second: 1 })
        expect(user.isDirty).toBe(true)
      })
    })
  })

  context('CalendarDate', () => {
    let user: User
    const originalBirthdateString = '1988-10-13'

    beforeEach(async () => {
      user = await User.create({
        email: 'ham@',
        password: 'chalupas',
        birthdate: DateTime.fromISO(originalBirthdateString),
      })
    })

    context('when the CalendarDate is a different object at the same date', () => {
      it('is false', () => {
        user.birthdate = CalendarDate.fromISO(user.birthdate!.toISO())
        expect(user.isDirty).toBe(false)
      })
    })

    context('when the date is different', () => {
      it('is true', () => {
        user.birthdate = user.birthdate!.plus({ day: 1 })
        expect(user.isDirty).toBe(true)
      })
    })
  })

  context('ClockTime', () => {
    let model: ModelForDatabaseTypeSpec
    const originalTimeString = '14:30:45.123456'

    beforeEach(async () => {
      model = await ModelForDatabaseTypeSpec.create({
        myTimeWithoutZone: ClockTime.fromISO(originalTimeString),
      })
    })

    context('when the ClockTime is a different object at the same time', () => {
      it('is false', () => {
        model.myTimeWithoutZone = ClockTime.fromISO(model.myTimeWithoutZone!.toISOTime())
        expect(model.isDirty).toBe(false)
      })
    })

    context('when the time is different', () => {
      it('is true', () => {
        model.myTimeWithoutZone = model.myTimeWithoutZone!.plus({ minute: 1 })
        expect(model.isDirty).toBe(true)
      })
    })
  })

  context('ClockTimeTz', () => {
    let model: ModelForDatabaseTypeSpec
    const originalTimeString = '14:30:45.123456-05:00'

    beforeEach(async () => {
      model = await ModelForDatabaseTypeSpec.create({
        myTimeWithZone: ClockTimeTz.fromISO(originalTimeString),
      })
    })

    context('when the ClockTime is a different object at the same time', () => {
      it('is false', () => {
        model.myTimeWithZone = ClockTimeTz.fromISO(model.myTimeWithZone!.toISOTime())
        expect(model.isDirty).toBe(false)
      })
    })

    context('when the time is different', () => {
      it('is true', () => {
        model.myTimeWithZone = model.myTimeWithZone!.plus({ minute: 1 })
        expect(model.isDirty).toBe(true)
      })
    })
  })

  context('with a blank record', () => {
    it('considers record to be dirty, even though no new attributes are being set explicitly', () => {
      const user = User.new()
      expect(user.isDirty).toEqual(true)
    })
  })

  context('STI', () => {
    context('when updating the type field on an STI record', () => {
      it('considers the record dirty', async () => {
        const user = await User.create({ email: 'how@yadoin', password: 'howyadoin' })
        const balloon = await Mylar.create({ user })
        expect(balloon.isDirty).toEqual(false)
        balloon.type = 'Animal'
        expect(balloon.isDirty).toEqual(true)
      })
    })
  })
})
