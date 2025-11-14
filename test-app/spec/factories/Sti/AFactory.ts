import { UpdateableProperties } from '@rvoh/dream/types'
import StiA from '@models/Sti/A.js'
import createPet from '@spec/factories/PetFactory.js'

export default async function createStiA(attrs: UpdateableProperties<StiA> = {}) {
  return await StiA.create({
    pet: attrs.pet ? null : await createPet(),
    ...attrs,
  })
}
