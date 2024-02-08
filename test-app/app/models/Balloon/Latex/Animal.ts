import STI from '../../../../../src/decorators/STI'
import { BalloonTypesEnum } from '../../../../db/schema'
import Latex from '../Latex'

@STI(Latex)
export default class Animal extends Latex {
  public get type() {
    return (this as Animal).getAttribute('type') as BalloonTypesEnum
  }

  public set type(newType: BalloonTypesEnum) {
    ;(this as Animal).setAttribute('type', 'Animal')
  }
}
