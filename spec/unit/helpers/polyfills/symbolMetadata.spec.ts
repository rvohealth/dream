import ts from 'typescript'
import STI from '../../../../src/decorators/class/STI.js'
import Decorators from '../../../../src/decorators/Decorators.js'
import StiChildCannotDeclareJSONColumnShape from '../../../../src/errors/sti/StiChildCannotDeclareJSONColumnShape.js'
import StiChildCannotDefineNewAssociations from '../../../../src/errors/sti/StiChildCannotDefineNewAssociations.js'
import ApplicationModel from '../../../../test-app/app/models/ApplicationModel.js'

// tsc emits decorated classes whose decorator context carries metadata only
// when `Symbol.metadata` exists; esbuild (vitest, tsx) creates it either way,
// so these specs compile their models with TypeScript itself
function defineTscCompiledStiChild(childBody: string) {
  const source = `
export function defineChild(STI: any, Decorators: any, Base: any) {
  const deco = new Decorators()

  @STI(Base)
  class TscCompiledStiChild extends Base {
    ${childBody}
  }

  return TscCompiledStiChild
}
`
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  })
  expect(outputText).toContain('Symbol.metadata')

  const compiledExports: { defineChild?: (STI: unknown, Decorators: unknown, Base: unknown) => unknown } = {}
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('exports', outputText)(compiledExports)

  class TscStiBase extends ApplicationModel {
    public override get table() {
      return 'model_for_openapi_type_specs' as const
    }
  }

  return () => compiledExports.defineChild!(STI, Decorators, TscStiBase)
}

// a runtime that defines Symbol.metadata itself makes it non-configurable,
// unlike the polyfill's assignment; Node 24 and 26 do not define it
const runtimeDefinesSymbolMetadata =
  Object.getOwnPropertyDescriptor(Symbol, 'metadata')?.configurable === false

describe('Symbol.metadata polyfill', () => {
  it.skipIf(runtimeDefinesSymbolMetadata)('is applied once Dream decorators are loaded', () => {
    expect((Symbol as unknown as { metadata?: symbol }).metadata).toBe(Symbol.for('Symbol.metadata'))
  })

  context('a tsc-compiled STI child', () => {
    it('that declares a new association throws when its class is defined', () => {
      expect(defineTscCompiledStiChild(`@deco.BelongsTo('Pet', { on: 'petId' }) public pet: any`)).toThrow(
        StiChildCannotDefineNewAssociations
      )
    })

    it('that declares @deco.JSON throws when its class is defined', () => {
      expect(
        defineTscCompiledStiChild(
          `@deco.JSON({ type: 'object', properties: { hello: 'string' } }) public jsonbData: any`
        )
      ).toThrow(StiChildCannotDeclareJSONColumnShape)
    })

    it('that declares nothing new loads', () => {
      expect(defineTscCompiledStiChild('')).not.toThrow()
    })
  })

  describe.skipIf(runtimeDefinesSymbolMetadata)('applying the polyfill', () => {
    const symbolConstructor = Symbol as unknown as { metadata?: symbol }
    let originalDescriptor: PropertyDescriptor | undefined

    beforeEach(() => {
      originalDescriptor = Object.getOwnPropertyDescriptor(Symbol, 'metadata')
    })

    afterEach(() => {
      delete symbolConstructor.metadata
      if (originalDescriptor) Object.defineProperty(Symbol, 'metadata', originalDescriptor)
    })

    it('defines Symbol.metadata as Symbol.for("Symbol.metadata") when the runtime lacks it', async () => {
      delete symbolConstructor.metadata
      const { default: polyfillSymbolMetadata } = await import(
        '../../../../src/helpers/polyfills/symbolMetadata.js'
      )

      polyfillSymbolMetadata()

      expect(symbolConstructor.metadata).toBe(Symbol.for('Symbol.metadata'))
    })

    it('does not replace a Symbol.metadata the runtime or app already defines', async () => {
      const existingMetadataSymbol = Symbol('app-defined Symbol.metadata')
      symbolConstructor.metadata = existingMetadataSymbol
      const { default: polyfillSymbolMetadata } = await import(
        '../../../../src/helpers/polyfills/symbolMetadata.js'
      )

      polyfillSymbolMetadata()

      expect(symbolConstructor.metadata).toBe(existingMetadataSymbol)
    })
  })
})
