import ValidationStatement from './shared'

export default function Presence(): any {
  return function (target: any, key: string, _: any) {
    Object.defineProperty(target.constructor, 'validations', {
      value: [
        ...(target.constructor.validations as ValidationStatement[]),
        {
          type: 'presence',
          column: key,
        } as ValidationStatement,
      ],
    })
  }
}
