import { describe as context } from '@jest/globals'
import defaultColumnForOrdering from '../../../src/helpers/defaultColumnForOrdering'
import ModelWithoutCreatedAt from '../../../test-app/app/models/ModelWithoutCreatedAt'
import ModelWithoutCreatedAtButWithFallback from '../../../test-app/app/models/ModelWithoutCreatedAtButWithFallback'
import NoDefaultOrderableColumn from '../../../src/exceptions/NoDefaultOrderableColumn'
import NonSequentialPrimaryKey from '../../../test-app/app/models/NonSequentialPrimaryKey'
import ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt from '../../../test-app/app/models/ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt'
import ModelWithNonSequentialPrimaryKey from '../../../test-app/app/models/ModelWithNonSequentialPrimaryKey'

describe('defaultColumnForOrdering', () => {
  context('defaultColumnForOrdering is defined on the dream class', () => {
    it('returns the defaultColumnForOrdering', () => {
      expect(defaultColumnForOrdering(ModelWithoutCreatedAtButWithFallback)).toEqual('datetime')
    })
  })

  context('defaultColumnForOrdering is not defined on the dream class', () => {
    context('the model has a sequential id type', () => {
      it('returns the id column', () => {
        expect(defaultColumnForOrdering(ModelWithoutCreatedAt)).toEqual('id')
      })
    })

    context('the model does not have a sequential id field', () => {
      context('the model has a createdAt field', () => {
        it('returns the createdAt column', () => {
          expect(defaultColumnForOrdering(ModelWithNonSequentialPrimaryKey)).toEqual('createdAt')
        })

        context('the user has overridden the createdAt field', () => {
          it('returns the overridden createdAt field', () => {
            expect(defaultColumnForOrdering(ModelWithNonSequentialPrimaryKeyAndCustomCreatedAt)).toEqual(
              'datetime'
            )
          })
        })
      })

      context('the model has no sequential id, nor a createdAt field', () => {
        it('raises', () => {
          expect(() => defaultColumnForOrdering(NonSequentialPrimaryKey)).toThrow(NoDefaultOrderableColumn)
        })
      })
    })
  })
})
