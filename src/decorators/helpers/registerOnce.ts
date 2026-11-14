import { isDeepStrictEqual } from 'node:util'
import Dream from '../../Dream.js'

interface RegisteredLists {
  validations: (typeof Dream)['validations']
  customValidations: (typeof Dream)['customValidations']
  virtualAttributes: (typeof Dream)['virtualAttributes']
  explicitUnsafeParamColumns: (typeof Dream)['explicitUnsafeParamColumns']
  encryptedAttributes: (typeof Dream)['encryptedAttributes']
  sortableFields: (typeof Dream)['sortableFields']
}

type RegisteredListEntry<Key extends keyof RegisteredLists> = RegisteredLists[Key][number]

/**
 * Appends `entry` to the decorator metadata list `key` on `dreamClass`, first
 * giving the class its own copy of the list it inherits, so an STI child
 * holds its base's entries alongside its own without writing to the base's
 * list.
 *
 * An entry for which `isSame` matches one already in the list is skipped: an
 * STI child's copy includes its base's entries, and the base's initializers
 * run again while the child is globally initialized.
 */
export default function registerOnce<Key extends keyof RegisteredLists>(
  dreamClass: typeof Dream,
  key: Key,
  entry: RegisteredListEntry<Key>,
  isSame: (existing: RegisteredListEntry<Key>, entry: RegisteredListEntry<Key>) => boolean = isDeepStrictEqual
) {
  const lists = dreamClass as unknown as Record<Key, readonly RegisteredListEntry<Key>[]>

  if (!Object.getOwnPropertyDescriptor(dreamClass, key)) {
    lists[key] = [...lists[key]]
  }

  const list = lists[key] as RegisteredListEntry<Key>[]
  if (list.some(existing => isSame(existing, entry))) return
  list.push(entry)
}
