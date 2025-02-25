import ModifierStatement from './modifier-statement'

const modifiers = {
  arrayCat: <const T>(arr: T[]) => new ModifierStatement('arrayCat', arr),
  arrayAppend: <const T>(val: T) => new ModifierStatement<'arrayAppend', T[]>('arrayAppend', val as T[]),
  arrayRemove: <const T>(val: T) => new ModifierStatement<'arrayRemove', T[]>('arrayRemove', val as T[]),
}

export default modifiers
