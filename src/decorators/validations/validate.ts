import Dream from '../../dream'

export default function Validate(): any {
  return function (target: any, key: string, _: any) {
    const t = target.constructor as typeof Dream
    if (!Object.getOwnPropertyDescriptor(t, 'customValidations'))
      t['customValidations'] = [...(t['customValidations'] || [])] as string[]

    t['customValidations'].push(key)
  }
}
