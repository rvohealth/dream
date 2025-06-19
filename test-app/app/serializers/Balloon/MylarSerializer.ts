import { BalloonLineMaterialsEnumValues } from '../../../types/db.js'
import Mylar from '../../models/Balloon/Mylar.js'
import BalloonSerializer from '../BalloonSerializer.js'

export default (data: Mylar) => BalloonSerializer(Mylar, data).attribute('mylarOnlyProperty')

export const BalloonDelegatedAttributeSerializer = (data: Mylar) =>
  BalloonSerializer(Mylar, data)
    .attribute('mylarOnlyProperty')
    .delegatedAttribute('myString', 'value', { openapi: 'string' })
    .delegatedAttribute('balloonLine', 'material', {
      openapi: { type: 'string', enum: BalloonLineMaterialsEnumValues },
    })
