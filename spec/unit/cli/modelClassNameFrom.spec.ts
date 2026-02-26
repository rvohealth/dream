import modelClassNameFrom from '../../../src/helpers/cli/modelClassNameFrom.js'

describe('modelClassNameFrom', () => {
  context('without an override', () => {
    it('derives the class name from a simple model name', () => {
      expect(modelClassNameFrom('User')).toEqual('User')
    })

    it('derives the class name from a namespaced model name', () => {
      expect(modelClassNameFrom('Room/Kitchen')).toEqual('RoomKitchen')
    })

    it('derives the class name from a deeply namespaced model name', () => {
      expect(modelClassNameFrom('Health/Coach/Certification')).toEqual('HealthCoachCertification')
    })

    it('standardizes and derives the class name from a lowercase model name', () => {
      expect(modelClassNameFrom('user')).toEqual('User')
    })

    it('standardizes and derives the class name from a snake_case model name', () => {
      expect(modelClassNameFrom('meal_type')).toEqual('MealType')
    })

    it('standardizes and derives the class name from a snake_case namespaced model name', () => {
      expect(modelClassNameFrom('health/coach_certification')).toEqual('HealthCoachCertification')
    })
  })

  context('with an override', () => {
    it('returns the override instead of the derived name', () => {
      expect(modelClassNameFrom('Room/Kitchen', 'Kitchen')).toEqual('Kitchen')
    })

    it('returns the override even for simple model names', () => {
      expect(modelClassNameFrom('User', 'CustomUser')).toEqual('CustomUser')
    })

    it('does not use the override when it is undefined', () => {
      expect(modelClassNameFrom('Room/Kitchen', undefined)).toEqual('RoomKitchen')
    })

    it('does not use the override when it is an empty string', () => {
      // empty string is falsy, so it falls through to derived name
      expect(modelClassNameFrom('Room/Kitchen', '')).toEqual('RoomKitchen')
    })
  })
})
