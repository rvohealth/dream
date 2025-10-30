import Dream from '../../src/Dream.js'

export default function processDynamicallyDefinedModels(...dreamClasses: (typeof Dream)[]) {
  Dream['globallyInitializingDecorators'] = true
  dreamClasses.forEach(modelClass => {
    new modelClass({}, { _internalUseOnly: true })
  })
  Dream['globallyInitializingDecorators'] = false
}
