import Dream from '../../Dream'

export default function Validate(): any {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return function (target: any, key: string, _: any) {
    const t = target.constructor as typeof Dream
    if (!Object.getOwnPropertyDescriptor(t, 'customValidations'))
      t['customValidations'] = [...(t['customValidations'] || [])] as string[]

    t['customValidations'].push(key)
  }
}
