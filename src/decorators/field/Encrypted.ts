import Dream from '../../Dream.js'
import DreamApp from '../../dream-app/index.js'
import defaultEncryptedColumnName from '../../encrypt/defaultEncryptedColumnName.js'
import InternalEncrypt from '../../encrypt/InternalEncrypt.js'
import DoNotSetEncryptedFieldsDirectly from '../../errors/DoNotSetEncryptedFieldsDirectly.js'
import ModelDeclaredShapeContainsReference from '../../errors/ModelDeclaredShapeContainsReference.js'
import columnAllowsNull from '../../helpers/db/columnAllowsNull.js'
import { DecoratorContext } from '../DecoratorContextType.js'
import { VirtualAttributeShape, VirtualAttributeStatement } from '../field-or-getter/Virtual.js'
import findOpenapiShapeReference from '../helpers/findOpenapiShapeReference.js'
import registerOnce from '../helpers/registerOnce.js'
import { validatesImplementation } from './validation/Validates.js'

export default function Encrypted(columnOrOptions?: string | EncryptedOptions): any {
  const { column, openapi }: EncryptedOptions =
    typeof columnOrOptions === 'string' ? { column: columnOrOptions } : (columnOrOptions ?? {})

  return function (_: undefined, context: DecoratorContext) {
    const key = context.name
    const encryptedKey = column || defaultEncryptedColumnName(key)
    // records whose legacy-key listeners for this property are running; a
    // read of the property on one of them returns its value without
    // dispatching the event again, so a listener that reads the property
    // does not recurse
    const recordsDispatchingLegacyKeyUsed = new WeakSet<Dream>()

    context.addInitializer(function (this: Dream) {
      const dreamClass: typeof Dream = this.constructor as typeof Dream
      if (!dreamClass['globallyInitializingDecorators']) {
        /**
         * Modern Javascript applies implicit accessors to instance properties
         * that don't have an accessor explicitly defined in the class definition.
         * The instance accessors shadow prototype accessors.
         * `addInitializer` is called by Decorators after an instance has been fully
         * constructed. We leverage this opportunity to delete the instance accessors
         * so that the prototype accessors applied by this decorator can be reached.
         */
        delete (this as any)[key]
        return
      }

      const reference = findOpenapiShapeReference(openapi)
      if (reference)
        throw new ModelDeclaredShapeContainsReference(
          dreamClass,
          '@deco.Encrypted',
          key,
          reference.key,
          reference.path
        )

      registerOnce(dreamClass, 'virtualAttributes', {
        property: key,
        type: openapi ?? (columnAllowsNull(dreamClass, encryptedKey) ? ['string', 'null'] : 'string'),
      } satisfies VirtualAttributeStatement)

      registerOnce(dreamClass, 'explicitUnsafeParamColumns', encryptedKey)

      registerOnce(dreamClass, 'encryptedAttributes', {
        property: key,
        encryptedColumnName: encryptedKey,
        shapeDeclared: openapi !== undefined,
      } satisfies EncryptedAttributeStatement)

      // checks the decrypted value against the property's shape, declared or
      // the inferred string, on every save; registered on every class that
      // initializes this, an STI child included
      validatesImplementation(this, key, 'declaredShape')

      const dreamPrototype = Object.getPrototypeOf(this)

      Object.defineProperty(dreamPrototype, key, {
        get() {
          const dream = this as Dream
          return InternalEncrypt.decryptColumn(this.getAttribute(encryptedKey), {
            onLegacyKeyUsed: () => {
              if (recordsDispatchingLegacyKeyUsed.has(dream)) return
              recordsDispatchingLegacyKeyUsed.add(dream)
              try {
                DreamApp.getOrFail().specialHooks.encryptionLegacyKeyUsed.forEach(fn => {
                  fn({ dream, property: key, encryptedColumnName: encryptedKey })
                })
              } finally {
                recordsDispatchingLegacyKeyUsed.delete(dream)
              }
            },
          })
        },

        set(val: any) {
          /**
           *
           * Modern Javascript sets all properties that do not have an explicit
           * assignment within the constructor to undefined in an implicit constructor.
           * Since the Dream constructor sets the value of properties of instances of
           * classes that extend Dream (e.g. when passing attributes to #new or #create
           * or when loading a model via one of the #find methods or #all), we need to
           * prevent those properties from being set back to undefined. Since all
           * properties corresponding to a database column get a setter, we achieve this
           * protection by including a guard in the setters that returns if this
           * property is set.
           *
           */
          if (this.columnSetterGuardActivated) return
          // On a persisted record, the ciphertext as loaded or last saved is
          // kept when the current key opens it to the assigned value, so
          // assigning a property the plaintext it already holds leaves the
          // record clean; any other value is encrypted fresh. Either way the
          // value is ciphertext Dream produced, so it bypasses setAttribute's
          // check that a backing column receives only decryptable ciphertext
          const dream = this as Dream
          this.setAttributeUnchecked(
            encryptedKey,
            InternalEncrypt.reuseOrEncryptColumn(
              val,
              dream.isPersisted ? dream['frozenAttributes'][encryptedKey] : undefined
            )
          )
        },

        configurable: false,
      })

      Object.defineProperty(dreamPrototype, encryptedKey, {
        get() {
          return this.currentAttributes[encryptedKey]
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set(_: any) {
          throw new DoNotSetEncryptedFieldsDirectly(dreamClass, encryptedKey, key)
        },

        configurable: false,
      })
    })
  }
}

export interface EncryptedOptions<ColumnName extends string = string> {
  column?: ColumnName
  openapi?: VirtualAttributeShape
}

export interface EncryptedAttributeStatement {
  property: string
  encryptedColumnName: string
  /**
   * Whether the decorator declared the value's shape (`openapi`). A bare
   * `@deco.Encrypted()` registers `'string'`, `null` added when the backing
   * column allows it, as read from the schema the app booted with; sync reads
   * the backing column's nullability fresh instead, so it types a bare one
   * from `'string'` rather than from that registration.
   */
  shapeDeclared: boolean
}
