import StiB from '../../models/Sti/B.js'
import { StiBaseSerializer, StiBaseSummarySerializer } from './BaseSerializer.js'

export const StiBSummarySerializer = (stiB: StiB) => StiBaseSummarySerializer(StiB, stiB)

export const StiBSerializer = (stiB: StiB) => StiBaseSerializer(StiB, stiB)
