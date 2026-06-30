import Dream from '../../src/Dream.js'

export default function processDynamicallyDefinedModels(...dreamClasses: (typeof Dream)[]) {
  Dream['globallyInitializingDecorators'] = true
  try {
    dreamClasses.forEach(modelClass => {
      new modelClass({}, { _internalUseOnly: true })
    })
  } finally {
    Dream['globallyInitializingDecorators'] = false
  }
}
