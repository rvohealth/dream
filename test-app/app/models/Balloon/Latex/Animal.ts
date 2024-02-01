import STI from '../../../../../src/decorators/STI'
import { BalloonTypesEnum } from '../../../../db/schema'
import Latex from '../Latex'

@STI(Latex)
export default class Animal extends Latex {
  public get type() {
    return this.getAttribute('type') as BalloonTypesEnum
  }

  public set type(newType: BalloonTypesEnum) {
    this.setAttribute('type', 'Animal')
  }
}
