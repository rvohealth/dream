import ThroughAssociationConditionsIncompatibleWithThroughAssociationSource from '../../../../../src/errors/associations/ThroughAssociationConditionsIncompatibleWithThroughAssociationSource.js'
import A from '../../../../../test-app/app/models/Through/A.js'
import AToOtherModelJoinModel from '../../../../../test-app/app/models/Through/AToOtherModelJoinModel.js'
import B from '../../../../../test-app/app/models/Through/B.js'
import MyModel from '../../../../../test-app/app/models/Through/MyModel.js'
import OtherModel from '../../../../../test-app/app/models/Through/OtherModel.js'

describe('through association chaining', () => {
  context('chaining through another model to yet another model', () => {
    it('carry through to the source association on another model', async () => {
      const myModel = await MyModel.create({ name: 'My model' })
      const otherModel = await OtherModel.create({ name: 'Other model', myModel })
      const a = await A.create({ name: 'A' })
      const b = await B.create({ name: 'B', a })
      await AToOtherModelJoinModel.create({ a, otherModel })

      const associatedA = await myModel.associationQuery('myA').first()
      expect(associatedA).toMatchDreamModel(a)

      const associatedB = await myModel.associationQuery('myB').first()
      expect(associatedB).toMatchDreamModel(b)
    })
  })

  context('conditions on a through association with a source that is itself a through association', () => {
    it('throws ThroughAssociationConditionsIncompatibleWithThroughAssociationSource', async () => {
      const myModel = await MyModel.create({ name: 'My model' })
      const otherModel = await OtherModel.create({ name: 'Other model', myModel })
      const a = await A.create({ name: 'A' })
      await B.create({ name: 'B', a })
      await AToOtherModelJoinModel.create({ a, otherModel })
      const beautifulA = await A.create({ name: 'Beautiful A' })
      await B.create({ name: 'B2', a: beautifulA })
      await AToOtherModelJoinModel.create({ a: beautifulA, otherModel })

      await expect(myModel.associationQuery('myConditionalA').first()).rejects.toThrow(
        ThroughAssociationConditionsIncompatibleWithThroughAssociationSource
      )
    })
  })
})
