import { UpdateableProperties } from '@rvoh/dream/types'
import StiB from '@models/Sti/B.js'

export default async function createStiB(attrs: UpdateableProperties<StiB> = {}) {
  return await StiB.create({
    ...attrs,
  })
}
