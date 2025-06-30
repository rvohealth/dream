import { UpdateableProperties } from '@rvoh/dream'
import A from '../../../app/models/Through/A.js'

let counter = 0

export default async function createThroughA(attrs: UpdateableProperties<A> = {}) {
  return await A.create({
    name: `Through/A name ${++counter}`,
    ...attrs,
  })
}
