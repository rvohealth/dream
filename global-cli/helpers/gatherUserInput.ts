import argAndValue from './argAndValue'
import Select from './select'

export interface NewAppCLIOptions {
  primaryKeyType: 'uuid' | 'integer' | 'bigint' | 'bigserial'
}

export const primaryKeyTypes = ['bigserial', 'bigint', 'integer', 'uuid'] as const
export const clientTypes = ['react', 'vue', 'nuxt', 'none (api only)', 'none'] as const

export type FrontEndClientType = 'react' | 'vue' | 'nuxt' | null

async function primaryKeyTypeQuestion(args: string[], options: NewAppCLIOptions) {
  const [primaryKeyArg, value] = argAndValue('--primaryKey', args)
  if (primaryKeyArg && primaryKeyTypes.includes(value! as (typeof primaryKeyTypes)[number])) {
    options.primaryKeyType = value as (typeof primaryKeyTypes)[number]
    return
  }

  const answer = await new Select('what primary key type would you like to use?', primaryKeyTypes).run()
  options.primaryKeyType = answer
}

export default async function gatherUserInput(args: string[]) {
  const options: NewAppCLIOptions = {
    primaryKeyType: 'bigserial',
  }

  await primaryKeyTypeQuestion(args, options)

  return options
}
