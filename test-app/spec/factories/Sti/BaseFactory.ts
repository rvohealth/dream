import { UpdateableProperties } from '@rvoh/dream/types'
import StiBase from '@models/Sti/Base.js'

let counter = 0

export default async function createStiBase(attrs: UpdateableProperties<StiBase> = {}) {
  return await StiBase.create({
    name: `Sti/Base name ${++counter}`,
    ...attrs,
  })
}
