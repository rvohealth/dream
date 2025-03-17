import STI from '../../../../src/decorators/class/STI.js'
import Balloon from '../Balloon.js'

// esbuild will sometimes translate class definitions to have a prefixing
// underscore, which will force the value entering the db to be "_Latex"
// instead of Latex. Forcing the name to be _Latex exposes all the places
// where this would be an issue, so that we can make sure to never use
// the wrong class name value.
//
// see https://github.com/evanw/esbuild/issues/1260 for more info
@STI(Balloon)
export default class _Latex extends Balloon {}
