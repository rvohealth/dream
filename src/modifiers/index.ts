import ModifierStatement from './modifier-statement'

const modifiers = {
  arrayCat: (arr: any[]) => new ModifierStatement('arrayCat', arr),
  arrayAppend: (val: any) => new ModifierStatement('arrayAppend', val),
  arrayRemove: (val: any) => new ModifierStatement('arrayRemove', val),
}

export default modifiers
