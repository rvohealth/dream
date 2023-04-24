import truncate from '../helpers/truncate'
import './jestMatchers/dreamModel'
import './jestMatchers/dreamModels'

beforeEach(async () => {
  await truncate()
})
declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchDreamModel(expected: any): CustomMatcherResult
      toMatchDreamModels(expected: any): CustomMatcherResult
    }
  }
}
