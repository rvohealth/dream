import ValidationStatement from './shared'

export default function Presence(): any {
  return function (target: any, key: string, _: any) {
    if (!Object.getOwnPropertyDescriptor(target.constructor, 'validations'))
      target.constructor.validations = [] as ValidationStatement[]

    target.constructor.validations.push({
      type: 'presence',
      column: key,
    } as ValidationStatement)
  }
}
