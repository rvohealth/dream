import StiA from '../../models/Sti/A.js'
import { StiBaseSerializer, StiBaseSummarySerializer } from './BaseSerializer.js'

export const StiASummarySerializer = (stiA: StiA) => StiBaseSummarySerializer(StiA, stiA)

export const StiASerializer = (stiA: StiA) => StiBaseSerializer(StiA, stiA)
