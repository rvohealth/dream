import Balloon from '../../../test-app/app/models/Balloon.js'
import Mylar from '../../../test-app/app/models/Balloon/Mylar.js'
import Pet from '../../../test-app/app/models/Pet.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.typeof', () => {
  it('is true when the class is the Dream class argument', () => {
    const dreamClass = Pet
    expect(dreamClass.typeof(Pet)).toBe(true)
  })

  it('is false when the class is not the Dream class argument', () => {
    const dreamClass = Pet
    expect(dreamClass.typeof(User)).toBe(false)
  })

  it('is true when the class is a descendant of the Dream class argument', () => {
    const dreamClass = Mylar
    expect(dreamClass.typeof(Balloon)).toBe(true)
  })

  it('is false when the class is extended by the Dream class argument', () => {
    const dreamClass = Balloon
    expect(dreamClass.typeof(Mylar)).toBe(false)
  })
})
